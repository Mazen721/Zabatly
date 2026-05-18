const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const os = require('os');
const User = require('../models/User');
const Vehicle = require('../models/vehicle');
const { createNotification } = require('../utils/notificationHelper');
const {
  OCR_MODEL,
  generateGeminiVisionJson,
  getImageMimeType,
  hasGeminiApiKey,
} = require('../utils/geminiFallback');

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

  if (shouldSendToAdminForInconclusiveExtraction(docType, normalizedResponse)) {
    const retryPrompt = buildFocusedGeminiOcrPrompt(docType);
    const retryResponse = await generateGeminiVisionJson(OCR_MODEL, retryPrompt, filePath, mimeType);
    normalizedResponse = applyMinimalServerValidation(retryResponse, docType, 'gemini');
  }

  return normalizedResponse;
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
      return res.status(400).json({ message: 'vehicleId is required for car license verification.' });
    }

    // 2. Prepare payload for Python OCR.
    const formData = new FormData();
    formData.append('file', fs.createReadStream(workingPath));
    formData.append('doc_type', doc_type);
    formData.append('run_fraud_check', 'true');

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

    // 4a. Log document type classification
    if (detected_doc_type && detected_doc_type !== doc_type && detected_doc_type !== 'unknown') {
      console.log(`Document type mismatch: user claimed '${doc_type}' but AI detected '${detected_doc_type}'`);
      console.log(`Processing using detected type '${effectiveDocType}'.`);
    }

    // 4b. Handle extraction failure that is not eligible for admin review.
    if (!success) {
      cleanupInputFile();
      return res.status(400).json({ message: 'AI could not read the document. Please use a clearer photo.' });
    }

    // 5. Strict auto-reject / auto-verify logic.
    let newKycStatus = 'pending';
    if (fraud_report.risk_level === 'HIGH_RISK' || validation?.is_valid === false) {
      newKycStatus = 'rejected';
    } else if (fraud_report.risk_level === 'CLEAN' && validation?.is_valid === true) {
      newKycStatus = 'verified';
    }

    // 6. Preserve image only when a human needs to review it.
    if (newKycStatus === 'pending') {
      ocrData.image_url = documentImageUrl;
      console.log('Document preserved for Admin review.');
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
      if (!vehicleId) {
        cleanupInputFile();
        return res.status(400).json({ message: 'vehicleId is required when detected document type is car_license.' });
      }

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
      user.kyc_status = newKycStatus;
    }

    await user.save();

    if (newKycStatus === 'verified') {
      await createNotification(req.user._id, 'Your identity verification has been approved.', 'kyc_approved');
    } else if (newKycStatus === 'rejected') {
      await createNotification(req.user._id, 'Your identity verification has been rejected.', 'kyc_rejected');
    }

    // If the AI rejected it immediately for fraud, send a 400.
    if (newKycStatus === 'rejected') {
      return res.status(400).json({
        message: 'Document rejected due to fraud risk or invalid document type.',
        reason: fraud_report.recommendation || 'Invalid document provided.',
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
