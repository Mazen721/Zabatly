const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const User = require('../models/User');
const Vehicle = require('../models/vehicle');
const KycAttempt = require('../models/KycAttempt');
const KycAuditLog = require('../models/KycAuditLog');
const { createNotification } = require('../utils/notificationHelper');
const {
  OCR_MODEL,
  generateGeminiVisionJson,
  getImageMimeType,
  hasGeminiApiKey,
} = require('../utils/geminiFallback');
const { validateEgyptianNID } = require('../utils/egyptianIdValidator');

const validTypes = ['national_id', 'passport', 'driver_license', 'car_license'];
const adminReviewDocTypes = ['national_id', 'passport', 'driver_license'];

const requiredFieldsByDocType = {
  national_id: ['national_id_number'],
  passport: ['document_number'],
  driver_license: ['license_number'],
  car_license: ['plate_number', 'chassis_number'],
};

const normalizeDigits = (value = '') => String(value)
  .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
  .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06F0));

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

const normalizeIdentifier = (value = '') => normalizeDigits(value).trim().replace(/[\s-]/g, '').toUpperCase();

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const flexibleIdentifierRegex = (value = '') => {
  const normalized = normalizeIdentifier(value);
  if (!normalized) return null;
  return new RegExp(`^\\s*${normalized.split('').map(escapeRegex).join('[\\s-]*')}\\s*$`, 'i');
};

const normalizeRiskLevel = (riskLevel) => {
  if (['CLEAN', 'MEDIUM_RISK', 'HIGH_RISK'].includes(riskLevel)) return riskLevel;
  return 'MEDIUM_RISK';
};

const createAdminReviewResponse = (docType, reason, provider = 'python_ocr') => ({
  success: true,
  detected_doc_type: docType,
  fields: {},
  fraud_report: {
    risk_level: 'MEDIUM_RISK',
    flags: ['INCONCLUSIVE_EXTRACTION'],
    recommendation: reason || 'AI could not confidently read this document. Send it to admin review.',
  },
  validation: {
    is_valid: true,
    errors: [],
  },
  ocr_provider: provider,
});

const shouldSendToAdminForInconclusiveExtraction = (docType, ocrData) => {
  if (!adminReviewDocTypes.includes(docType)) return false;

  const fields = ocrData?.fields || {};
  const filledFields = Object.values(fields).filter(hasValue).length;
  const detectedType = ocrData?.detected_doc_type;
  const effectiveDocType = detectedType && detectedType !== 'unknown' ? detectedType : docType;
  const requiredFields = requiredFieldsByDocType[effectiveDocType] || [];
  const missingRequiredFields = requiredFields.some((field) => !hasValue(fields[field]));

  return ocrData?.success === false && (
    filledFields === 0 ||
    !detectedType ||
    detectedType === 'unknown' ||
    missingRequiredFields
  );
};

const isChecksumOnlyFailure = (ocrData) => {
  const flags = ocrData?.fraud_report?.flags || [];
  const errors = ocrData?.validation?.errors || [];
  const warnings = ocrData?.fraud_report?.recommendation || '';

  // Check if the only issue is a checksum mismatch
  const hasChecksumWarning = flags.some((f) => f.includes('CHECKSUM_MISMATCH_OCR'));
  const hasValidationWarning = flags.some((f) => f.includes('VALIDATION_WARNING') && f.includes('CHECKSUM'));
  const hasChecksumError = errors.some((e) =>
    e.toLowerCase().includes('checksum') ||
    e.toLowerCase().includes('invalid national id checksum')
  );

  // It's a checksum-only failure if:
  // - There's a checksum warning/error
  // - No other structural HIGH_RISK flags
  const hasOtherHighRisk = flags.some((f) =>
    (f.includes('EMPTY_EXTRACTION') ||
     f.includes('VERY_LOW_EXTRACTION') ||
     f.includes('TYPE_MISMATCH_HIGH') ||
     f.includes('UNRECOGNIZED_DOCUMENT')) &&
    !f.includes('CHECKSUM')
  );

  return (hasChecksumWarning || hasValidationWarning || hasChecksumError) && !hasOtherHighRisk;
};

const applyMinimalServerValidation = (ocrData, claimedDocType, provider) => {
  const response = {
    success: Boolean(ocrData?.success),
    detected_doc_type: validTypes.includes(ocrData?.detected_doc_type)
      ? ocrData.detected_doc_type
      : (ocrData?.detected_doc_type === 'unknown' ? 'unknown' : claimedDocType),
    fields: ocrData?.fields && typeof ocrData.fields === 'object' ? { ...ocrData.fields } : {},
    fraud_report: {
      risk_level: normalizeRiskLevel(ocrData?.fraud_report?.risk_level || 'CLEAN'),
      flags: Array.isArray(ocrData?.fraud_report?.flags) ? [...ocrData.fraud_report.flags] : [],
      recommendation: ocrData?.fraud_report?.recommendation || '',
    },
    validation: {
      is_valid: ocrData?.validation?.is_valid !== false,
      errors: Array.isArray(ocrData?.validation?.errors) ? [...ocrData.validation.errors] : [],
    },
    ocr_provider: provider,
  };

  const effectiveDocType =
    response.detected_doc_type && response.detected_doc_type !== 'unknown'
      ? response.detected_doc_type
      : claimedDocType;

  if (effectiveDocType === 'national_id') {
    const nationalId = normalizeDigits(response.fields.national_id_number || response.fields.document_number || '')
      .replace(/[\s-]/g, '');

    if (nationalId) {
      response.fields.national_id_number = nationalId;
      response.fields.document_number = response.fields.document_number || nationalId;

      if (!/^\d{14}$/.test(nationalId)) {
        response.validation.is_valid = false;
        response.validation.errors.push('National ID must be exactly 14 digits.');
        response.fraud_report.risk_level = 'HIGH_RISK';
        response.fraud_report.flags.push('INVALID_NATIONAL_ID_FORMAT');
      }
    }
  }

  const requiredFields = requiredFieldsByDocType[effectiveDocType] || [];
  const missingFields = requiredFields.filter((field) => !hasValue(response.fields[field]));

  if (missingFields.length > 0 && response.validation.is_valid !== false) {
    if (response.fraud_report.risk_level !== 'HIGH_RISK') {
      response.fraud_report.risk_level = 'MEDIUM_RISK';
    }
    response.fraud_report.flags.push(`MISSING_REQUIRED_FIELDS: ${missingFields.join(', ')}`);
    response.fraud_report.recommendation ||= 'AI extraction is incomplete. Send this document to admin review.';
  }

  return response;
};

const buildGeminiOcrPrompt = (docType) => `
You are an OCR and document review system for Zabatly, an Egyptian car rental platform.
Extract data from the uploaded image. The user claimed the document type is "${docType}".
The image may contain Arabic text and Arabic-Indic digits. Read both Arabic and English text carefully.

Return strict JSON only with this exact top-level shape:
{
  "success": true,
  "detected_doc_type": "national_id | passport | driver_license | car_license | unknown",
  "fields": {},
  "fraud_report": { "risk_level": "CLEAN|MEDIUM_RISK|HIGH_RISK", "flags": [], "recommendation": "" },
  "validation": { "is_valid": true, "errors": [] }
}

Supported field schemas:
- national_id: full_name_ar, full_name_en, national_id_number, date_of_birth, gender, address, document_number, issue_date, expiry_date, marital_status, religion, occupation
- passport: full_name_ar, full_name_en, document_number, nationality, date_of_birth, gender, place_of_birth, issue_date, expiry_date, national_id_number
- driver_license: full_name_ar, license_number, license_type, date_of_birth, issue_date, expiry_date, traffic_unit, blood_type, national_id_number
- car_license: plate_number, plate_letters_ar, chassis_number, engine_number, vehicle_make, vehicle_model, vehicle_year, vehicle_color, owner_name_ar, license_expiry

Rules:
- Do not invent missing text. Use null for unknown fields.
- If Arabic-Indic digits are visible, convert them to ASCII digits in number fields.
- For Egyptian National ID front cards, the 14-digit national ID is usually printed as large spaced digits near the lower-right/front-middle of the card. Extract it even if spaces appear between digits.
- For Egyptian National ID front cards, also extract the visible Arabic name and address when readable.
- For Egyptian driving licenses, extract any visible license number and national ID number separately if both appear.
- If the image is a supported document but essential fields are unreadable, set success to false, detected_doc_type to the best guess or "unknown", fields to any fields you can read, fraud_report.risk_level to "MEDIUM_RISK", and validation.is_valid to true.
- If the image is clearly not a supported document, obviously tampered, or contains an impossible national ID format, use "HIGH_RISK" and validation.is_valid false.
- For Egyptian National ID, national_id_number must be 14 digits when readable, and document_number should be the same value.
- Prefer pending/admin review uncertainty over clean verification when the extraction is doubtful.
`;

const buildFocusedGeminiOcrPrompt = (docType) => `
You are doing a second-pass OCR extraction for an Egyptian "${docType}" document image.
The previous extraction missed required fields, so focus only on visible text and numbers.

Return strict JSON only:
{
  "success": true,
  "detected_doc_type": "national_id | passport | driver_license | car_license | unknown",
  "fields": {},
  "fraud_report": { "risk_level": "CLEAN|MEDIUM_RISK|HIGH_RISK", "flags": [], "recommendation": "" },
  "validation": { "is_valid": true, "errors": [] }
}

Critical OCR instructions:
- Read Arabic text directly from the image.
- Convert Arabic-Indic digits to ASCII digits.
- Ignore spaces between digits when extracting national_id_number or document_number.
- For a national ID card, look for the 14 large digits near the bottom/right side and extract them as national_id_number and document_number.
- For a national ID card, extract full_name_ar and address if readable.
- If you can see a valid 14-digit national ID but cannot read all other fields, still set success true and risk_level "MEDIUM_RISK".
- If no required number or name can be read, set success false and risk_level "MEDIUM_RISK".
- Never invent values that are not visible.
`;

const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);

const runGeminiOcrFallback = async (filePath, docType) => {
  const prompt = buildGeminiOcrPrompt(docType);
  const mimeType = getImageMimeType(filePath);
  const geminiResponse = await generateGeminiVisionJson(OCR_MODEL, prompt, filePath, mimeType);
  let normalizedResponse = applyMinimalServerValidation(geminiResponse, docType, 'gemini');

  // Retry on inconclusive extraction
  if (shouldSendToAdminForInconclusiveExtraction(docType, normalizedResponse)) {
    console.log('Gemini OCR: Inconclusive extraction, retrying with focused prompt...');
    const retryPrompt = buildFocusedGeminiOcrPrompt(docType);
    const retryResponse = await generateGeminiVisionJson(OCR_MODEL, retryPrompt, filePath, mimeType);
    normalizedResponse = applyMinimalServerValidation(retryResponse, docType, 'gemini');
  }

  // Auto-retry on checksum-only failures (OCR likely misread one digit)
  if (docType === 'national_id' && normalizedResponse.success !== false) {
    const nid = normalizeDigits(normalizedResponse.fields?.national_id_number || '').replace(/[\s-]/g, '');
    if (nid && /^\d{14}$/.test(nid)) {
      const nidValidation = validateEgyptianNID(nid);
      if (!nidValidation.isValid && nidValidation.errors.some((e) => e.toLowerCase().includes('checksum'))) {
        console.log('Gemini OCR: NID checksum failed, doing focused re-read...');
        const retryPrompt = buildFocusedGeminiOcrPrompt(docType);
        const retryResponse = await generateGeminiVisionJson(OCR_MODEL, retryPrompt, filePath, mimeType);
        const retryNormalized = applyMinimalServerValidation(retryResponse, docType, 'gemini');
        const retryNid = normalizeDigits(retryNormalized.fields?.national_id_number || '').replace(/[\s-]/g, '');
        if (retryNid && /^\d{14}$/.test(retryNid)) {
          const retryValidation = validateEgyptianNID(retryNid);
          if (retryValidation.isValid) {
            console.log('Gemini OCR: Retry fixed the checksum! Using retry result.');
            normalizedResponse = retryNormalized;
          }
        }
      }
    }
  }

  return normalizedResponse;
};

const parseDateFlexible = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const cleaned = dateStr.trim();

  // Try standard formats like YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY
  const parts = cleaned.split(/[-/.]/);
  if (parts.length === 3 && parts.every((part) => /^\d{1,4}$/.test(part))) {
    let y;
    let m;
    let d;

    // Check if YYYY is first
    if (parts[0].length === 4) {
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      d = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      y = parseInt(parts[2], 10);
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
    }

    if (y && m && d) {
      const dateVal = new Date(y, m - 1, d);
      if (
        dateVal.getFullYear() === y &&
        dateVal.getMonth() === m - 1 &&
        dateVal.getDate() === d
      ) {
        return dateVal;
      }
      return null;
    }
  }

  // Fallback to Date.parse
  const parsed = Date.parse(cleaned);
  if (!isNaN(parsed)) return new Date(parsed);
  return null;
};

// @desc    Upload document, send to Python AI, and update KYC status
// @route   POST /api/users/kyc/verify
const verifyDocument = async (req, res) => {
  let workingPath = null;
  let tempPath = null;
  let documentImageUrl = '';

  const cleanupInputFile = () => {
    if (tempPath && fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (_) {
        /* ignore */
      }
      return;
    }
    if (workingPath && fs.existsSync(workingPath) && !isHttpUrl(req.file?.path)) {
      try {
        fs.unlinkSync(workingPath);
      } catch (_) {
        /* ignore */
      }
    }
  };

  try {
    // 1. Validation
    if (!req.file) {
      return res.status(400).json({ message: 'No document image provided.' });
    }

    documentImageUrl = req.file.path;
    workingPath = documentImageUrl;

    if (isHttpUrl(documentImageUrl)) {
      try {
        const response = await axios.get(documentImageUrl, { responseType: 'arraybuffer', timeout: 120000 });
        const ext = path.extname(req.file.originalname || '').toLowerCase();
        const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
        tempPath = path.join(os.tmpdir(), `kyc-${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`);
        await fs.promises.writeFile(tempPath, Buffer.from(response.data));
        workingPath = tempPath;
      } catch (e) {
        console.error('Failed to fetch uploaded image for OCR:', e.message);
        return res.status(502).json({ message: 'Could not load the uploaded image for processing.' });
      }
    }

    const { doc_type, vehicleId } = req.body;

    if (!validTypes.includes(doc_type)) {
      cleanupInputFile();
      return res.status(400).json({ message: 'Invalid document type.' });
    }

    if (doc_type === 'car_license' && !vehicleId) {
      cleanupInputFile();
      return res.status(400).json({ message: 'vehicleId is required to attach a car license to a vehicle.' });
    }

    // Feature 5 Retry Limit Check (3 attempts per doc_type per day, 24h lockout)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const attemptCount = await KycAttempt.countDocuments({
      userId: req.user._id,
      doc_type,
      createdAt: { $gte: twentyFourHoursAgo },
    });

    if (attemptCount >= 3) {
      cleanupInputFile();
      return res.status(429).json({
        message: 'Too many verification attempts. Please try again after 24 hours.',
      });
    }

    // 2. Prepare payload for Python OCR.
    const formData = new FormData();
    formData.append('file', fs.createReadStream(workingPath));
    formData.append('doc_type', doc_type);

    // 3. Call Python OCR first. Gemini is server-side fallback only.
    let ocrData;
    let geminiFallbackAttempted = false;
    try {
      const pythonResponse = await axios.post('http://localhost:8000/api/ocr/scan', formData, {
        headers: { ...formData.getHeaders() },
        timeout: 120000,
      });

      ocrData = applyMinimalServerValidation(pythonResponse.data, doc_type, 'python_ocr');

      if (ocrData.success === false && hasGeminiApiKey()) {
        console.warn('Python OCR returned success:false. Trying Gemini OCR fallback.');
        geminiFallbackAttempted = true;
        ocrData = await runGeminiOcrFallback(workingPath, doc_type);
      } else if (shouldSendToAdminForInconclusiveExtraction(doc_type, ocrData)) {
        ocrData = createAdminReviewResponse(
          doc_type,
          'Local OCR could not determine this document. Send it to admin review.',
          'python_ocr'
        );
      }
    } catch (aiError) {
      console.error(geminiFallbackAttempted ? 'Gemini OCR Fallback Error:' : 'Python OCR Error:', aiError.message);

      if (!hasGeminiApiKey() || geminiFallbackAttempted) {
        cleanupInputFile();
        return res.status(503).json({ message: 'AI Service is currently down.' });
      }

      try {
        geminiFallbackAttempted = true;
        ocrData = await runGeminiOcrFallback(workingPath, doc_type);
      } catch (geminiError) {
        cleanupInputFile();
        console.error('Gemini OCR Fallback Error:', geminiError.message);
        return res.status(503).json({ message: 'AI Service is currently down.' });
      }
    }

    if (shouldSendToAdminForInconclusiveExtraction(doc_type, ocrData)) {
      ocrData = createAdminReviewResponse(
        doc_type,
        'AI could not determine this document. Send it to admin review.',
        ocrData.ocr_provider
      );
    }

    const { success, fields, fraud_report, validation, detected_doc_type, ocr_provider } = ocrData;
    console.log(`KYC OCR provider used: ${ocr_provider}`);
    console.log('AI Extraction Results:', JSON.stringify({ fields, validation, detected_doc_type, ocr_provider }, null, 2));

    const effectiveDocType =
      detected_doc_type && detected_doc_type !== 'unknown'
        ? detected_doc_type
        : doc_type;

    if (effectiveDocType === 'car_license' && !vehicleId) {
      cleanupInputFile();
      return res.status(400).json({ message: 'vehicleId is required to attach a car license to a vehicle.' });
    }

    // 4a. Log document type classification
    if (detected_doc_type && detected_doc_type !== doc_type && detected_doc_type !== 'unknown') {
      console.log(`Document type mismatch: user claimed '${doc_type}' but AI detected '${detected_doc_type}'`);
      console.log(`Processing using detected type '${effectiveDocType}'.`);
    }

    // Feature 7: Expected fields and confidence score calculation
    const expectedFieldsByDocType = {
      national_id: ['full_name_ar', 'national_id_number', 'date_of_birth', 'gender', 'address'],
      passport: ['full_name_en', 'document_number', 'nationality', 'date_of_birth', 'gender', 'expiry_date'],
      driver_license: ['full_name_ar', 'license_number', 'license_type', 'date_of_birth', 'expiry_date'],
      car_license: ['plate_number', 'chassis_number', 'engine_number', 'vehicle_make', 'vehicle_model', 'license_expiry'],
    };

    const expectedFields = expectedFieldsByDocType[effectiveDocType] || [];
    let filledCount = 0;
    expectedFields.forEach(field => {
      if (fields && fields[field] !== undefined && fields[field] !== null && String(fields[field]).trim() !== '' && String(fields[field]).trim().toLowerCase() !== 'null') {
        filledCount++;
      }
    });
    const confidence_score = expectedFields.length > 0 ? Math.round((filledCount / expectedFields.length) * 100) : 100;
    console.log(`Calculated confidence score: ${confidence_score}%`);

    // Feature 1: Explicit Document Expiry Validation
    if (effectiveDocType !== 'national_id') {
      const expiryStr = (effectiveDocType === 'car_license') ? fields.license_expiry : fields.expiry_date;
      if (expiryStr) {
        const expiryDate = parseDateFlexible(expiryStr);
        if (expiryDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0); // only compare date parts
          if (expiryDate < today) {
            validation.is_valid = false;
            if (!validation.errors) validation.errors = [];
            if (!validation.errors.includes('Document has expired')) {
              validation.errors.push('Document has expired');
            }
            fraud_report.risk_level = 'HIGH_RISK';
            if (!fraud_report.flags) fraud_report.flags = [];
            if (!fraud_report.flags.includes('EXPIRED_DOCUMENT')) {
              fraud_report.flags.push('EXPIRED_DOCUMENT');
            }
            fraud_report.recommendation = 'Document has expired';
          }
        }
      }
    }

    // 4c. Gemini NID Validation
    if (ocr_provider === 'gemini' && effectiveDocType === 'national_id') {
      const nidValidation = validateEgyptianNID(fields.national_id_number, fields.date_of_birth);
      if (!nidValidation.isValid) {
        validation.is_valid = false;
        validation.errors = [...new Set([...(validation.errors || []), ...nidValidation.errors])];
        fraud_report.risk_level = 'HIGH_RISK';
        fraud_report.recommendation = nidValidation.errors.join(', ');
      }
    }

    // Feature 3: Duplicate ID Detection
    let isDuplicate = false;
    if (effectiveDocType === 'national_id' || effectiveDocType === 'passport') {
      const extractedNumber = fields.national_id_number || fields.document_number;
      if (extractedNumber) {
        const normalizedNumber = normalizeIdentifier(extractedNumber);
        fields.national_id_number = effectiveDocType === 'national_id' ? normalizedNumber : fields.national_id_number;
        fields.document_number = normalizedNumber;
        const numberRegex = flexibleIdentifierRegex(normalizedNumber);
        const duplicateUser = await User.findOne({
          _id: { $ne: req.user._id },
          $or: [
            { 'identity_document.document_number': normalizedNumber },
            ...(numberRegex ? [{ 'identity_document.document_number': numberRegex }] : []),
          ],
        });
        if (duplicateUser) isDuplicate = true;
      }
    } else if (effectiveDocType === 'driver_license') {
      const extractedNumber = fields.license_number;
      if (extractedNumber) {
        const normalizedNumber = normalizeIdentifier(extractedNumber);
        fields.license_number = normalizedNumber;
        const numberRegex = flexibleIdentifierRegex(normalizedNumber);
        const duplicateUser = await User.findOne({
          _id: { $ne: req.user._id },
          $or: [
            { 'driving_license.license_number': normalizedNumber },
            ...(numberRegex ? [{ 'driving_license.license_number': numberRegex }] : []),
          ],
        });
        if (duplicateUser) isDuplicate = true;
      }
    } else if (effectiveDocType === 'car_license') {
      const extractedPlate = fields.plate_number;
      if (extractedPlate) {
        const normalizedPlate = normalizeIdentifier(extractedPlate);
        fields.plate_number = normalizedPlate;
        const plateRegex = flexibleIdentifierRegex(normalizedPlate);
        const duplicateVehicle = await Vehicle.findOne({
          owner: { $ne: req.user._id },
          $or: [
            { 'car_license.plate_number': normalizedPlate },
            ...(plateRegex ? [{ 'car_license.plate_number': plateRegex }] : []),
          ],
        });
        if (duplicateVehicle) isDuplicate = true;
      }
    }

    if (isDuplicate) {
      cleanupInputFile();

      // Feature 5 Retry Limit log record
      await KycAttempt.create({
        userId: req.user._id,
        doc_type: doc_type,
        result: 'rejected',
      });

      // Feature 8 Audit log with SHA-256 privacy hash and proxies IP support
      const docNumber = fields.national_id_number || fields.document_number || fields.license_number || fields.plate_number || '';
      const document_number_hash = docNumber ? crypto.createHash('sha256').update(String(docNumber).trim()).digest('hex') : null;
      const xForwardedFor = req.headers['x-forwarded-for'];
      const ip_address = xForwardedFor ? `${xForwardedFor.split(',')[0].trim()} (${req.ip})` : (req.ip || '');

      await KycAuditLog.create({
        userId: req.user._id,
        doc_type: effectiveDocType,
        provider: ocr_provider || 'python_ocr',
        confidence_score,
        result: 'rejected',
        risk_level: 'HIGH_RISK',
        fraud_flags: ['DUPLICATE_DOCUMENT'],
        validation_errors: ['This ID is already registered to another account'],
        ip_address,
        user_agent: req.headers['user-agent'] || '',
        document_number_hash,
        quality_score: ocrData.quality_score || null,
      });

      return res.status(400).json({
        message: 'This ID is already registered to another account',
        errors: ['Duplicate document number detected.']
      });
    }

    // 4b. Handle extraction failure that is not eligible for admin review.
    if (!success) {
      cleanupInputFile();

      // Feature 5 Retry Limit log record
      await KycAttempt.create({
        userId: req.user._id,
        doc_type: doc_type,
        result: 'error',
      });

      // Feature 8 Audit log
      const xForwardedFor = req.headers['x-forwarded-for'];
      const ip_address = xForwardedFor ? `${xForwardedFor.split(',')[0].trim()} (${req.ip})` : (req.ip || '');

      await KycAuditLog.create({
        userId: req.user._id,
        doc_type: effectiveDocType,
        provider: ocr_provider || 'python_ocr',
        confidence_score: 0,
        result: 'error',
        risk_level: 'HIGH_RISK',
        fraud_flags: ['EXTRACTION_FAILED'],
        validation_errors: ['AI could not read the document.'],
        ip_address,
        user_agent: req.headers['user-agent'] || '',
        document_number_hash: null,
        quality_score: ocrData.quality_score || null,
      });

      // Provide specific error messages based on the failure reason
      const qualityScore = ocrData.quality_score || 0;
      const fraudFlags = fraud_report?.flags || [];
      let userMessage = 'AI could not read the document. Please try the following:';
      const suggestions = [];

      if (fraudFlags.some((f) => f.includes('IMAGE_TOO_DARK'))) {
        suggestions.push('Take the photo in a well-lit area or use camera flash.');
      } else if (fraudFlags.some((f) => f.includes('IMAGE_OVEREXPOSED'))) {
        suggestions.push('Avoid direct light and glare on the document surface.');
      } else if (fraudFlags.some((f) => f.includes('BLURRY') || f.includes('IMAGE_QUALITY'))) {
        suggestions.push('Hold the camera steady and tap to focus before taking the photo.');
      } else if (fraudFlags.some((f) => f.includes('IMAGE_TOO_SMALL'))) {
        suggestions.push('Move the camera closer to the document or use a higher resolution camera.');
      }

      if (suggestions.length === 0) {
        suggestions.push('Use a clear, well-lit photo of the document.');
        suggestions.push('Make sure the entire document is visible and not cut off.');
        suggestions.push('Avoid shadows and glare on the document.');
      }

      userMessage += ' ' + suggestions.join(' ');

      return res.status(400).json({
        message: userMessage,
        suggestions,
      });
    }

    // 5. Strict auto-reject / auto-verify logic.
    let newKycStatus = 'pending';
    if (fraud_report.risk_level === 'HIGH_RISK' || validation?.is_valid === false) {
      newKycStatus = 'rejected';
    } else if (fraud_report.risk_level === 'CLEAN' && validation?.is_valid === true) {
      newKycStatus = 'verified';
    }

    // Route checksum-only failures to admin review instead of rejection
    // This is the key fix: OCR often misreads 1 digit, causing checksum failure.
    // The document is likely valid and should be reviewed by a human.
    if (newKycStatus === 'rejected' && isChecksumOnlyFailure(ocrData)) {
      console.log('Checksum-only failure detected — routing to manual_review instead of rejecting.');
      newKycStatus = 'manual_review';
      fraud_report.risk_level = 'MEDIUM_RISK';
      fraud_report.recommendation = 'NID checksum failed, likely due to OCR misread. Routed to admin review.';
    }

    // Feature 7: Route low confidence to manual_review
    if (newKycStatus !== 'rejected' && confidence_score < 80 && fraud_report.risk_level !== 'HIGH_RISK') {
      newKycStatus = 'manual_review';
    }

    // 6. Preserve image only when a human needs to review it.
    if (newKycStatus === 'pending' || newKycStatus === 'manual_review') {
      ocrData.image_url = documentImageUrl;
      console.log(`Document preserved for Admin ${newKycStatus} review.`);
      if (tempPath && fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch (_) {
          /* ignore */
        }
      }
    } else {
      cleanupInputFile();
    }

    // 7. Save OCR data to MongoDB.
    if (effectiveDocType === 'car_license') {
      if (vehicleId) {
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });
        if (vehicle.owner.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Unauthorized' });

        vehicle.car_license = {
          plate_number: fields.plate_number || null,
          chassis_number: fields.chassis_number || null,
          document_url: documentImageUrl,
          extracted_data: ocrData,
          verified_at: newKycStatus === 'verified' ? Date.now() : null,
        };
        vehicle.kyc_status = newKycStatus;
        await vehicle.save();

        if (newKycStatus === 'verified') {
          await createNotification(req.user._id, 'Your vehicle license has been approved.', 'kyc_approved');
        } else if (newKycStatus === 'rejected') {
          await createNotification(req.user._id, 'Your vehicle license has been rejected.', 'kyc_rejected');
        }
      }

      // Feature 5 Retry Limit Log
      await KycAttempt.create({
        userId: req.user._id,
        doc_type: doc_type,
        result: newKycStatus,
      });

      // Feature 8 Audit log
      const docNumber = fields.plate_number || fields.chassis_number || '';
      const document_number_hash = docNumber ? crypto.createHash('sha256').update(String(docNumber).trim()).digest('hex') : null;
      const xForwardedFor = req.headers['x-forwarded-for'];
      const ip_address = xForwardedFor ? `${xForwardedFor.split(',')[0].trim()} (${req.ip})` : (req.ip || '');

      await KycAuditLog.create({
        userId: req.user._id,
        doc_type: effectiveDocType,
        provider: ocr_provider || 'python_ocr',
        confidence_score,
        result: newKycStatus,
        risk_level: fraud_report.risk_level || 'CLEAN',
        fraud_flags: fraud_report.flags || [],
        validation_errors: validation?.errors || [],
        ip_address,
        user_agent: req.headers['user-agent'] || '',
        document_number_hash,
        quality_score: ocrData.quality_score || null,
      });

      return res.status(200).json({ message: 'Vehicle license processed', status: newKycStatus, data: fields });
    }

    const user = await User.findById(req.user._id);

    if (effectiveDocType === 'national_id' || effectiveDocType === 'passport') {
      user.identity_document = {
        doc_type: effectiveDocType,
        document_number: fields.national_id_number || fields.document_number || null,
        document_url: documentImageUrl,
        extracted_data: ocrData,
        verified_at: newKycStatus === 'verified' ? Date.now() : null,
      };
      user.kyc_status = newKycStatus;
    } else if (effectiveDocType === 'driver_license') {
      user.driving_license = {
        license_number: fields.license_number || null,
        document_url: documentImageUrl,
        extracted_data: ocrData,
        status: newKycStatus,
        is_verified: newKycStatus === 'verified',
        verified_at: newKycStatus === 'verified' ? Date.now() : null,
      };
    }

    await user.save();

    if (newKycStatus === 'verified') {
      await createNotification(req.user._id, 'Your identity verification has been approved.', 'kyc_approved');
    } else if (newKycStatus === 'rejected') {
      await createNotification(req.user._id, 'Your identity verification has been rejected.', 'kyc_rejected');
    }

    // Feature 5 Retry Limit Log
    await KycAttempt.create({
      userId: req.user._id,
      doc_type: doc_type,
      result: newKycStatus,
    });

    // Feature 8 Audit log
    const docNumber = fields.national_id_number || fields.document_number || fields.license_number || '';
    const document_number_hash = docNumber ? crypto.createHash('sha256').update(String(docNumber).trim()).digest('hex') : null;
    const xForwardedFor = req.headers['x-forwarded-for'];
    const ip_address = xForwardedFor ? `${xForwardedFor.split(',')[0].trim()} (${req.ip})` : (req.ip || '');

    await KycAuditLog.create({
      userId: req.user._id,
      doc_type: effectiveDocType,
      provider: ocr_provider || 'python_ocr',
      confidence_score,
      result: newKycStatus,
      risk_level: fraud_report.risk_level || 'CLEAN',
      fraud_flags: fraud_report.flags || [],
      validation_errors: validation?.errors || [],
      ip_address,
      user_agent: req.headers['user-agent'] || '',
      document_number_hash,
      quality_score: ocrData.quality_score || null,
    });

    // If the AI rejected it immediately for fraud, send a 400.
    if (newKycStatus === 'rejected') {
      // Provide specific, actionable error messages
      const rejectionErrors = validation?.errors || [];
      const rejectionFlags = fraud_report?.flags || [];
      let userReason = fraud_report.recommendation || 'Invalid document provided.';

      // Simplify the reason for the user
      if (rejectionFlags.some((f) => f.includes('EXPIRED_DOCUMENT'))) {
        userReason = 'Your document has expired. Please upload a valid, non-expired document.';
      } else if (rejectionFlags.some((f) => f.includes('TYPE_MISMATCH'))) {
        userReason = 'The uploaded document does not match the selected document type. Please check and try again.';
      } else if (rejectionFlags.some((f) => f.includes('UNRECOGNIZED_DOCUMENT'))) {
        userReason = 'The AI could not recognize this as a valid Egyptian document. Please upload a clear photo of your official ID, passport, or license.';
      }

      return res.status(400).json({
        message: userReason,
        reason: userReason,
        errors: rejectionErrors,
      });
    }

    return res.status(200).json({ message: 'Identity processed', status: newKycStatus, data: fields });
  } catch (error) {
    console.error('KYC Error:', error);
    cleanupInputFile();
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { verifyDocument };
