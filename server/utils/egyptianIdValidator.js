/**
 * Egyptian National ID Validator
 * Mirroring the python validation logic in server/ocr_service/validators.py
 */

function validateLength(id) {
  return typeof id === 'string' && /^\d{14}$/.test(id);
}

function validateCentury(id) {
  if (!validateLength(id)) return false;
  const centuryDigit = id[0];
  return centuryDigit === '2' || centuryDigit === '3';
}

function validateDateOfBirth(id) {
  if (!validateLength(id)) return false;
  
  const yy = id.substring(1, 3);
  const mm = id.substring(3, 5);
  const dd = id.substring(5, 7);
  const centuryDigit = id[0];
  
  const century = centuryDigit === '2' ? 1900 : 2000;
  const year = century + parseInt(yy, 10);
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  // Sanity check: must be in the past
  const today = new Date();
  if (date > today) return false;
  if (year < 1900) return false;

  return true;
}

function validateGovernorate(id) {
  if (!validateLength(id)) return false;
  const govList = [
    '01','02','03','04','11','12','13','14','15','16','17','18',
    '19','21','22','23','24','25','26','27','28','29','31','32',
    '33','34','35','88'
  ];
  const govCode = id.substring(7, 9);
  return govList.includes(govCode);
}

function validateChecksum(id) {
  if (!validateLength(id)) return false;
  const weights = [2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(id[i], 10) * weights[i];
  }
  const remainder = sum % 11;
  if (remainder >= 10) {
    return false;
  }
  const digit14 = parseInt(id[13], 10);
  return remainder === digit14;
}

function parseDateFlexible(dateStr) {
  if (!dateStr) return null;
  const cleaned = String(dateStr).trim();
  
  // Try YYYY-MM-DD or YYYY/MM/DD
  let match = cleaned.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
      return d;
    }
  }

  // Try DD-MM-YYYY or DD/MM/YYYY
  match = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
      return d;
    }
  }

  const timestamp = Date.parse(cleaned);
  if (!isNaN(timestamp)) {
    return new Date(timestamp);
  }

  return null;
}

function crossCheckDOB(idNumber, extractedDOB) {
  if (!validateLength(idNumber)) return false;
  const parsedExtracted = parseDateFlexible(extractedDOB);
  if (!parsedExtracted) return true; // allow if no DOB extracted (or skip mismatch error)
  
  const yy = idNumber.substring(1, 3);
  const mm = idNumber.substring(3, 5);
  const dd = idNumber.substring(5, 7);
  const centuryDigit = idNumber[0];
  const century = centuryDigit === '2' ? 1900 : 2000;
  const year = century + parseInt(yy, 10);
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);
  
  const nidDate = new Date(year, month - 1, day);
  
  const diffMs = Math.abs(nidDate.getTime() - parsedExtracted.getTime());
  const oneDayMs = 24 * 60 * 60 * 1000;
  return diffMs <= oneDayMs;
}

function validateEgyptianNID(idNumber, extractedDOB) {
  const errors = [];
  const id = typeof idNumber === 'string' ? idNumber.replace(/[\s-]/g, '') : '';

  if (!id) {
    errors.push('National ID number is missing.');
    return { isValid: false, errors, extractedDOB: null };
  }

  if (!validateLength(id)) {
    errors.push('National ID must be exactly 14 digits.');
    return { isValid: false, errors, extractedDOB: null };
  }

  if (!validateCentury(id)) {
    errors.push(`Invalid century digit '${id[0]}'. Expected 2 (1900s) or 3 (2000s).`);
  }

  let parsedDOBStr = null;
  if (!validateDateOfBirth(id)) {
    errors.push('Invalid date of birth in NID.');
  } else {
    const yy = id.substring(1, 3);
    const mm = id.substring(3, 5);
    const dd = id.substring(5, 7);
    const centuryDigit = id[0];
    const century = centuryDigit === '2' ? 1900 : 2000;
    const year = century + parseInt(yy, 10);
    parsedDOBStr = `${year}-${mm}-${dd}`;
  }

  if (!validateGovernorate(id)) {
    errors.push(`Invalid governorate code '${id.substring(7, 9)}' in NID.`);
  }

  if (!validateChecksum(id)) {
    errors.push('Invalid National ID checksum.');
  }

  if (extractedDOB && !crossCheckDOB(id, extractedDOB)) {
    errors.push('DOB mismatch between NID and extracted DOB.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    extractedDOB: parsedDOBStr
  };
}

module.exports = {
  validateLength,
  validateCentury,
  validateDateOfBirth,
  validateGovernorate,
  validateChecksum,
  crossCheckDOB,
  validateEgyptianNID,
};
