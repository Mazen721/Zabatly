"""
Egyptian Document Validators — validates extracted OCR data
against known Egyptian document rules and formats.
"""

import re
import logging
from datetime import datetime, date
from typing import Optional

logger = logging.getLogger(__name__)


# ============================================================
# Egyptian Governorate Codes (for National ID validation)
# Digits 8-9 of the 14-digit NID
# ============================================================
GOVERNORATE_CODES = {
    "01": "القاهرة",          # Cairo
    "02": "الإسكندرية",       # Alexandria
    "03": "بورسعيد",          # Port Said
    "04": "السويس",           # Suez
    "11": "دمياط",            # Damietta
    "12": "الدقهلية",         # Dakahlia
    "13": "الشرقية",          # Sharqia
    "14": "القليوبية",        # Qalyubia
    "15": "كفر الشيخ",       # Kafr El Sheikh
    "16": "الغربية",          # Gharbia
    "17": "المنوفية",         # Menoufia
    "18": "البحيرة",          # Beheira
    "19": "الإسماعيلية",      # Ismailia
    "21": "الجيزة",           # Giza
    "22": "بني سويف",         # Beni Suef
    "23": "الفيوم",           # Fayoum
    "24": "المنيا",           # Minya
    "25": "أسيوط",            # Asyut
    "26": "سوهاج",            # Sohag
    "27": "قنا",              # Qena
    "28": "أسوان",            # Aswan
    "29": "الأقصر",           # Luxor
    "31": "البحر الأحمر",     # Red Sea
    "32": "الوادي الجديد",    # New Valley
    "33": "مطروح",            # Matrouh
    "34": "شمال سيناء",       # North Sinai
    "35": "جنوب سيناء",       # South Sinai
    "88": "خارج الجمهورية",   # Born outside Egypt
}


def _parse_date_flexible(date_str: Optional[str]) -> Optional[date]:
    """
    Try to parse a date string in common formats.
    Returns None if unparseable.
    """
    if not date_str:
        return None

    date_str = date_str.strip()

    formats = [
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%Y/%m/%d",
        "%m/%d/%Y",
        "%d.%m.%Y",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue

    return None


def _is_digits_only(s: str) -> bool:
    """Check if string contains only ASCII or Arabic-Indic digits."""
    # Replace Arabic-Indic digits with ASCII
    arabic_digits = "٠١٢٣٤٥٦٧٨٩"
    ascii_digits = "0123456789"
    for a, d in zip(arabic_digits, ascii_digits):
        s = s.replace(a, d)
    return s.isdigit()


def _normalize_digits(s: str) -> str:
    """Convert Arabic-Indic digits to ASCII digits."""
    if not s:
        return s
    arabic_digits = "٠١٢٣٤٥٦٧٨٩"
    ascii_digits = "0123456789"
    for a, d in zip(arabic_digits, ascii_digits):
        s = s.replace(a, d)
    return s


# ============================================================
# National ID Validator
# ============================================================

def validate_national_id(fields: dict) -> dict:
    """
    Validate an Egyptian National ID.
    Returns a dict with:
      - 'errors': list of hard validation errors (structural impossibilities)
      - 'warnings': list of soft warnings (likely OCR errors, not fraud)
    
    14-digit format: C YYMMDD GG SSSS K
    - C: Century (2=1900s, 3=2000s)
    - YYMMDD: Date of birth
    - GG: Governorate code
    - SSSS: Serial (odd=male, even=female)
    - K: Check digit
    """
    errors = []
    warnings = []
    nid = fields.get("national_id_number", "")

    if not nid:
        errors.append("National ID number is missing.")
        return {"errors": errors, "warnings": warnings}

    # Normalize Arabic-Indic digits
    nid = _normalize_digits(nid)
    # Remove any spaces or dashes
    nid = re.sub(r"[\s\-]", "", nid)

    if len(nid) != 14:
        errors.append(f"National ID must be exactly 14 digits, got {len(nid)}: '{nid}'")
        return {"errors": errors, "warnings": warnings}

    if not nid.isdigit():
        errors.append(f"National ID must contain only digits: '{nid}'")
        return {"errors": errors, "warnings": warnings}

    # Track structural checks for lenient checksum handling
    structural_ok = True

    # Century digit
    century_digit = nid[0]
    if century_digit not in ("2", "3"):
        errors.append(f"Invalid century digit '{century_digit}'. Expected 2 (1900s) or 3 (2000s).")
        structural_ok = False

    # Date of birth extraction
    yy = nid[1:3]
    mm = nid[3:5]
    dd = nid[5:7]
    century = 1900 if century_digit == "2" else 2000
    year = century + int(yy)
    month = int(mm)
    day = int(dd)

    try:
        dob = date(year, month, day)
        # Sanity: should be in the past and person should be alive (not before 1900)
        if dob > date.today():
            errors.append(f"Date of birth {dob} is in the future — impossible.")
            structural_ok = False
        if dob.year < 1900:
            errors.append(f"Date of birth year {dob.year} is before 1900 — unlikely.")
            structural_ok = False
    except ValueError:
        errors.append(f"Invalid date of birth in NID: {year}-{mm}-{dd}")
        structural_ok = False

    # Governorate code
    gov_code = nid[7:9]
    if gov_code not in GOVERNORATE_CODES:
        errors.append(f"Invalid governorate code '{gov_code}' in NID. Not a known Egyptian governorate.")
        structural_ok = False

    # Checksum validation (digit 14)
    # IMPORTANT: Checksum failures are treated as WARNINGS, not errors.
    # OCR commonly misreads 1 digit out of 14, which fails the checksum.
    # If all other structural checks pass, this is likely an OCR error,
    # not a fraudulent document. Route to admin review instead of rejecting.
    weights = [2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
    total_sum = sum(int(nid[i]) * weights[i] for i in range(13))
    remainder = total_sum % 11
    expected_digit = (11 - remainder) % 10
    digit14 = int(nid[13])
    checksum_valid = True
    if expected_digit != digit14:
        checksum_valid = False

    if not checksum_valid:
        if structural_ok:
            # All other checks pass — likely an OCR misread, not fraud
            warnings.append(
                f"CHECKSUM_MISMATCH_OCR: NID checksum failed (digit 14 is {digit14}, "
                f"calculated {expected_digit}). This is likely an OCR misread of one digit. "
                f"Route to admin review."
            )
            logger.info(f"NID checksum mismatch (likely OCR error): expected {expected_digit}, got {digit14}")
        else:
            # Other structural issues too — more suspicious
            errors.append("Invalid National ID checksum.")

    # Gender check (digits 10-13, the serial)
    serial = nid[9:13]
    gender_from_nid = "male" if int(serial) % 2 == 1 else "female"
    
    # Cross-check with extracted gender field — treat as warning, not error
    # OCR can misread gender text on the card
    extracted_gender = fields.get("gender", "").lower().strip()
    if extracted_gender and extracted_gender in ("male", "female"):
        if extracted_gender != gender_from_nid:
            warnings.append(
                f"Gender mismatch: NID serial indicates '{gender_from_nid}' "
                f"but extracted gender is '{extracted_gender}'. May be OCR error."
            )

    # Cross-check DOB with extracted date_of_birth field — treat as warning
    extracted_dob = _parse_date_flexible(fields.get("date_of_birth"))
    if extracted_dob:
        try:
            nid_dob = date(year, month, day)
            if extracted_dob != nid_dob:
                warnings.append(
                    f"DOB mismatch: NID encodes {nid_dob.isoformat()} "
                    f"but extracted DOB is {extracted_dob.isoformat()}. May be OCR error."
                )
        except ValueError:
            pass  # Already flagged above

    return {"errors": errors, "warnings": warnings}


# ============================================================
# Passport Validator
# ============================================================

def validate_passport(fields: dict) -> list[str]:
    """Validate Egyptian Passport fields."""
    errors = []
    doc_num = fields.get("document_number", "")

    if not doc_num:
        errors.append("Passport number is missing.")
        return errors

    doc_num = _normalize_digits(doc_num).strip().upper()

    # Egyptian passports: typically A + 8 digits (but format may vary)
    if len(doc_num) < 7:
        errors.append(f"Passport number '{doc_num}' seems too short.")

    # Check expiry
    expiry = _parse_date_flexible(fields.get("expiry_date"))
    if expiry and expiry < date.today():
        errors.append(f"Passport has expired on {expiry.isoformat()}.")

    return errors


# ============================================================
# Driving License Validator
# ============================================================

VALID_LICENSE_TYPES = {
    "private", "professional", "heavy_truck", "bus",
    "خاصة", "مهنية", "نقل ثقيل", "أتوبيس",
    "خاصه", "مهنيه",
}


def validate_driving_license(fields: dict) -> list[str]:
    """Validate Egyptian Driving License fields."""
    errors = []

    license_num = fields.get("license_number", "")
    if not license_num:
        errors.append("License number is missing.")
    else:
        # Normalize digits and strip spaces/dashes
        license_num = _normalize_digits(str(license_num)).strip()
        license_num = re.sub(r"[\s\-]", "", license_num)
        # Allow alphanumeric — some licenses have letter prefixes
        cleaned = re.sub(r"[^a-zA-Z0-9]", "", license_num)
        if len(cleaned) < 5:
            errors.append(f"Driving license number seems too short: '{license_num}'.")
        elif len(cleaned) > 15:
            errors.append(f"Driving license number seems too long: '{license_num}'.")

    # Validate license type
    license_type = (fields.get("license_type") or "").strip().lower()
    if license_type and license_type not in VALID_LICENSE_TYPES:
        errors.append(f"Unknown license type: '{license_type}'.")

    # Check expiry
    expiry = _parse_date_flexible(fields.get("expiry_date"))
    if expiry and expiry < date.today():
        errors.append(f"Driving license has expired on {expiry.isoformat()}.")

    return errors


# ============================================================
# Car License (Vehicle Registration) Validator
# ============================================================

def validate_car_license(fields: dict) -> list[str]:
    """Validate Egyptian Car License fields."""
    errors = []

    plate = fields.get("plate_number", "")
    if not plate:
        errors.append("Plate number is missing.")

    chassis = fields.get("chassis_number", "")
    if chassis:
        chassis = _normalize_digits(chassis).strip()
        # VIN/Chassis should be 17 characters (alphanumeric)
        # But Egyptian older vehicles may have shorter formats
        if len(chassis) < 10:
            errors.append(f"Chassis number '{chassis}' seems too short (expected ~17 chars).")
        if len(chassis) > 20:
            errors.append(f"Chassis number '{chassis}' seems too long.")
    else:
        errors.append("Chassis number is missing.")

    # Check license expiry
    expiry = _parse_date_flexible(fields.get("license_expiry"))
    if expiry and expiry < date.today():
        errors.append(f"Car license has expired on {expiry.isoformat()}.")

    return errors


# ============================================================
# Master Validation Dispatcher
# ============================================================

_VALIDATORS = {
    "national_id": validate_national_id,
    "passport": validate_passport,
    "driver_license": validate_driving_license,
    "car_license": validate_car_license,
}


def validate_document(doc_type: str, fields: dict) -> dict:
    """
    Run the appropriate validator for the given document type.
    Returns {"is_valid": bool, "errors": list[str], "warnings": list[str]}.
    
    For national_id, the validator returns a dict with errors and warnings.
    For other doc types, the validator returns a list of errors.
    Warnings are soft issues (like checksum mismatches) that should route
    to admin review rather than auto-rejection.
    """
    validator = _VALIDATORS.get(doc_type)
    if not validator:
        return {"is_valid": True, "errors": [], "warnings": []}

    result = validator(fields)

    # national_id validator returns a dict with errors and warnings
    if isinstance(result, dict):
        errors = result.get("errors", [])
        warnings = result.get("warnings", [])
    else:
        # Other validators return a plain list of errors
        errors = result
        warnings = []

    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
    }
