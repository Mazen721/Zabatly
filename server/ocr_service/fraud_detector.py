"""
Fraud Detection Engine for Egyptian Documents.
Multi-signal approach that flags real issues, not OCR imperfections.

Key principle: We do NOT auto-flag fraud just because OCR is imperfect.
Only structural impossibilities and validation failures trigger HIGH_RISK.
OCR quality issues (checksum mismatches, partial extraction) route to admin review.
"""

import logging
from datetime import date
from typing import Optional

from validators import validate_document

logger = logging.getLogger(__name__)


def _count_non_null_fields(fields: dict) -> tuple[int, int]:
    """
    Count how many fields are non-null / non-empty.
    Returns (filled_count, total_count).
    """
    total = len(fields)
    filled = sum(
        1 for v in fields.values()
        if v is not None and str(v).strip() != "" and str(v).strip().lower() != "null"
    )
    return filled, total


def _check_extraction_quality(
    fields: dict,
    expected_field_counts: Optional[tuple] = None,
) -> list[str]:
    """
    Check if the OCR extraction produced enough data.
    Too many empty fields suggests an unreadable document, not fraud.
    
    Uses expected_field_counts (filled, total) if provided to avoid
    inflating the ratio with injected backward-compatible None keys.
    """
    flags = []

    if expected_field_counts:
        filled, total = expected_field_counts
    else:
        filled, total = _count_non_null_fields(fields)

    if total == 0:
        flags.append("EMPTY_EXTRACTION: No fields were returned by OCR.")
        return flags

    fill_ratio = filled / total

    if fill_ratio < 0.1:
        flags.append(
            f"VERY_LOW_EXTRACTION: Only {filled}/{total} fields extracted ({fill_ratio:.0%}). "
            f"Document may be unreadable or not a valid document."
        )
    elif fill_ratio < 0.25:
        flags.append(
            f"LOW_EXTRACTION: Only {filled}/{total} fields extracted ({fill_ratio:.0%}). "
            f"Image quality may be poor."
        )

    return flags


def _check_document_type_consistency(
    claimed_type: str,
    detected_type: str,
    detection_confidence: str,
) -> list[str]:
    """
    Check if the user-claimed document type matches what the VLM detected.
    Mismatch with high confidence is suspicious.
    """
    flags = []

    if detected_type == "unknown":
        flags.append("UNRECOGNIZED_DOCUMENT: The AI could not determine the document type.")
        return flags

    if claimed_type != detected_type:
        if detection_confidence == "high":
            flags.append(
                f"TYPE_MISMATCH_HIGH: User claimed '{claimed_type}' but AI detected "
                f"'{detected_type}' with high confidence. Possible wrong document uploaded."
            )
        elif detection_confidence == "medium":
            flags.append(
                f"TYPE_MISMATCH_MEDIUM: User claimed '{claimed_type}' but AI detected "
                f"'{detected_type}'. Could be a classification error or wrong document."
            )
        # Low confidence mismatches are not flagged — the classification may be wrong

    return flags


def _check_document_expiry(fields: dict, doc_type: str) -> list[str]:
    """Check if the document is expired."""
    flags = []

    expiry_field = {
        "national_id": "expiry_date",
        "passport": "expiry_date",
        "driver_license": "expiry_date",
        "car_license": "license_expiry",
    }.get(doc_type)

    if not expiry_field:
        return flags

    expiry_str = fields.get(expiry_field)
    if not expiry_str:
        return flags

    from validators import _parse_date_flexible
    expiry_date = _parse_date_flexible(expiry_str)
    
    if expiry_date and expiry_date < date.today():
        flags.append(
            f"EXPIRED_DOCUMENT: Document expired on {expiry_date.isoformat()}. "
            f"An expired document cannot be used for verification."
        )

    return flags


def _check_image_quality(quality_score: float) -> list[str]:
    """
    Flag low image quality based on Laplacian variance score.
    Very low = blurry / unreadable, but NOT fraud.
    """
    flags = []
    if quality_score < 10:
        flags.append(
            f"VERY_LOW_IMAGE_QUALITY: Score {quality_score:.0f}. "
            f"Image is extremely blurry or low resolution."
        )
    elif quality_score < 30:
        flags.append(
            f"LOW_IMAGE_QUALITY: Score {quality_score:.0f}. "
            f"Image quality is poor — text may be hard to read."
        )
    return flags


def assess_fraud(
    fields: dict,
    doc_type: str,
    claimed_doc_type: str,
    detected_doc_type: str,
    detection_confidence: str,
    validation_result: dict,
    image_quality_score: float,
    expected_field_counts: Optional[tuple] = None,
) -> dict:
    """
    Perform multi-signal fraud assessment.
    
    Separates two concerns:
    1. OCR QUALITY ISSUES — poor images, partial extraction, checksum mismatches
       → These route to MEDIUM_RISK (admin review), not rejection.
    2. STRUCTURAL FRAUD — impossible NID values, completely wrong document type
       → These route to HIGH_RISK (rejection).
    
    Returns:
    {
        "risk_level": "CLEAN" | "MEDIUM_RISK" | "HIGH_RISK",
        "flags": ["list of flag strings"],
        "recommendation": "Human-readable summary"
    }
    """
    all_flags = []

    # 1. Extraction quality (uses accurate expected field counts)
    all_flags.extend(_check_extraction_quality(fields, expected_field_counts))

    # 2. Document type consistency
    all_flags.extend(
        _check_document_type_consistency(claimed_doc_type, detected_doc_type, detection_confidence)
    )

    # 3. Document expiry
    all_flags.extend(_check_document_expiry(fields, doc_type))

    # 4. Image quality
    all_flags.extend(_check_image_quality(image_quality_score))

    # 5. Validation errors (from the Egyptian validators)
    validation_errors = validation_result.get("errors", [])
    for err in validation_errors:
        all_flags.append(f"VALIDATION_ERROR: {err}")

    # 5b. Validation warnings (OCR-quality issues like checksum mismatches)
    validation_warnings = validation_result.get("warnings", [])
    for warn in validation_warnings:
        all_flags.append(f"VALIDATION_WARNING: {warn}")

    # ============================================================
    # Determine Risk Level
    # ============================================================
    
    # HIGH RISK: Only structural impossibilities and clear fraud signals
    high_risk_patterns = [
        "EMPTY_EXTRACTION",
        "VERY_LOW_EXTRACTION",
        "TYPE_MISMATCH_HIGH",
        "UNRECOGNIZED_DOCUMENT",
    ]
    
    # Structural validation errors = genuine impossibilities (HIGH_RISK)
    structural_validation_errors = [
        err for err in validation_errors
        if any(kw in err.lower() for kw in [
            "must be exactly 14",
            "only digits",
            "invalid century",
            "invalid date of birth",
            "invalid governorate",
            "is in the future",
        ])
    ]

    has_high_risk = any(
        any(pattern in flag for pattern in high_risk_patterns)
        for flag in all_flags
    ) or len(structural_validation_errors) > 0

    # MEDIUM RISK: OCR quality issues, warnings, partial extraction
    # These should route to admin review, NOT auto-rejection
    has_medium_risk = any(
        any(pattern in flag for pattern in [
            "EXPIRED_DOCUMENT",
            "LOW_EXTRACTION",
            "TYPE_MISMATCH_MEDIUM",
            "LOW_IMAGE_QUALITY",
            "VERY_LOW_IMAGE_QUALITY",
            "CHECKSUM_MISMATCH_OCR",
            "VALIDATION_WARNING",
        ])
        for flag in all_flags
    )

    # Non-structural validation errors (expired, too short, etc.) are MEDIUM
    non_structural_errors = [e for e in validation_errors if e not in structural_validation_errors]
    if non_structural_errors and not has_high_risk:
        has_medium_risk = True

    # ============================================================
    # Build final risk assessment
    # ============================================================
    if has_high_risk:
        risk_level = "HIGH_RISK"
        recommendation = (
            "Document rejected due to critical validation failures. "
            "The document appears to have structural issues that indicate "
            "it may be invalid or fraudulent. "
            "Flags: " + "; ".join(all_flags)
        )
    elif has_medium_risk:
        risk_level = "MEDIUM_RISK"
        recommendation = (
            "Document has some issues that require admin review. "
            "These may be due to an expired document, poor image quality, "
            "or minor OCR reading errors (e.g., one digit misread). "
            "Flags: " + "; ".join(all_flags)
        )
    else:
        risk_level = "CLEAN"
        recommendation = (
            "Document appears authentic. All Egyptian validation checks passed."
        )

    result = {
        "risk_level": risk_level,
        "flags": all_flags,
        "recommendation": recommendation,
    }

    logger.info(f"🔒 Fraud assessment: {risk_level} ({len(all_flags)} flags)")
    for flag in all_flags:
        logger.info(f"   🚩 {flag}")

    return result
