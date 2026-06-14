"""
Egyptian Document OCR Microservice
===================================
FastAPI application that provides document OCR, classification,
field extraction, validation, and fraud detection for Egyptian official documents.

Endpoint: POST /api/ocr/scan
  - Accepts multipart form: file (image), doc_type (string)
  - Returns JSON compatible with the Node.js kycController

Pipeline:
  1. Image preprocessing (OpenCV)
  2. Document classification (Qwen2.5-VL via Ollama)
  3. Field extraction (Qwen2.5-VL via Ollama)
  4. Egyptian validation rules
  5. Fraud detection
  6. JSON response
"""

import logging
import sys
import os

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from preprocessing import preprocess_image
from ocr_engine import classify_document, extract_fields, is_ollama_ready
from validators import validate_document
from fraud_detector import assess_fraud
from schemas import OCRResponse, FraudReport, ValidationResult

# ============================================================
# Logging Configuration
# ============================================================
# Reconfigure stdout to handle UTF-8 (emojis) on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# ============================================================
# FastAPI App
# ============================================================
app = FastAPI(
    title="Egyptian Document OCR Service",
    description="OCR microservice for Egyptian National ID, Passport, Driving License, and Car License",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Expected fields per doc type — used for accurate fill ratio
# ============================================================
EXPECTED_FIELDS_BY_DOC_TYPE = {
    "national_id": [
        "full_name_ar", "national_id_number", "date_of_birth",
        "gender", "address", "marital_status", "religion",
        "occupation", "issue_date", "expiry_date",
    ],
    "passport": [
        "full_name_ar", "full_name_en", "document_number",
        "nationality", "date_of_birth", "gender",
        "place_of_birth", "issue_date", "expiry_date",
    ],
    "driver_license": [
        "full_name_ar", "license_number", "license_type",
        "date_of_birth", "issue_date", "expiry_date",
        "traffic_unit", "blood_type",
    ],
    "car_license": [
        "plate_number", "plate_letters_ar", "chassis_number",
        "engine_number", "vehicle_make", "vehicle_model",
        "vehicle_year", "vehicle_color", "owner_name_ar",
        "license_expiry",
    ],
}


def _count_expected_fields(fields: dict, doc_type: str) -> tuple:
    """
    Count filled expected fields for a given doc type.
    Only counts doc-type-specific fields, NOT injected backward-compatible keys.
    Returns (filled, total).
    """
    expected = EXPECTED_FIELDS_BY_DOC_TYPE.get(doc_type, [])
    if not expected:
        # Fallback: count all non-None fields
        total = len(fields)
        filled = sum(
            1 for v in fields.values()
            if v is not None and str(v).strip() != "" and str(v).strip().lower() != "null"
        )
        return filled, total

    total = len(expected)
    filled = 0
    for field_name in expected:
        v = fields.get(field_name)
        if v is not None and str(v).strip() != "" and str(v).strip().lower() != "null":
            filled += 1
    return filled, total


@app.get("/")
async def health():
    """Health check endpoint."""
    ollama_ready = is_ollama_ready()
    return {
        "status": "running",
        "service": "Egyptian Document OCR",
        "ollama_ready": ollama_ready,
        "model": "qwen2.5vl:7b",
    }


@app.get("/api/health")
async def api_health():
    """API health check."""
    return {"status": "ok", "ollama": is_ollama_ready()}


@app.post("/api/ocr/scan")
async def scan_document(
    file: UploadFile = File(..., description="Document image file"),
    doc_type: str = Form("auto", description="Document type: national_id, passport, driver_license, car_license, or auto"),
):
    """
    Main OCR endpoint — processes a document image through the full pipeline.
    
    This endpoint is called by the Node.js kycController at:
      POST http://localhost:8000/api/ocr/scan
    
    The response format matches what kycController.js expects:
      { success, fields, fraud_report, validation }
    """
    logger.info(f"📄 Received scan request: doc_type='{doc_type}', file='{file.filename}'")

    # ============================================================
    # 0. Validate inputs
    # ============================================================
    valid_types = ["national_id", "passport", "driver_license", "car_license", "auto"]
    if doc_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid doc_type '{doc_type}'. Must be one of: {valid_types}",
        )

    # Check Ollama availability
    if not is_ollama_ready():
        logger.error("❌ Ollama is not available or model not pulled.")
        raise HTTPException(
            status_code=503,
            detail=(
                "AI model is not available. "
                "Please ensure Ollama is running and qwen2.5vl model is pulled. "
                "Run: ollama pull qwen2.5vl:7b"
            ),
        )

    # Read file bytes
    try:
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")
        logger.info(f"📦 File size: {len(file_bytes) / 1024:.1f} KB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    # ============================================================
    # 1. Image Preprocessing
    # ============================================================
    logger.info("🔧 Step 1: Preprocessing image...")
    try:
        prep_result = preprocess_image(file_bytes)
        enhanced_b64 = prep_result["enhanced_b64"]
        original_b64 = prep_result["original_b64"]
        quality_score = prep_result["quality_score"]
        brightness_score = prep_result["brightness_score"]
        quality_tier = prep_result["quality_tier"]
        min_dimension = prep_result["min_dimension"]
        logger.info(f"📊 Quality: {quality_score:.1f}, Brightness: {brightness_score:.1f}, "
                     f"Tier: {quality_tier}, Min dim: {min_dimension}px")

        # Quality Gate — Only reject truly unusable images
        if min_dimension < 200 or quality_score < 5:
            logger.warning(f"❌ Image rejected: too small/blank (min_dim={min_dimension}, quality={quality_score:.1f})")
            return OCRResponse(
                success=False,
                detected_doc_type="unknown",
                fields={},
                fraud_report=FraudReport(
                    risk_level="HIGH_RISK",
                    flags=["IMAGE_TOO_SMALL"],
                    recommendation=(
                        "Image is too small or appears blank. "
                        "Please upload a photo with at least 200px on each side."
                    ),
                ),
                validation=ValidationResult(is_valid=False, errors=[
                    "Image is too small or blank. Please upload a higher resolution photo."
                ]),
                quality_score=quality_score,
            ).model_dump()

        if quality_score < 8:
            logger.warning(f"⚠️ Very poor image quality ({quality_score:.1f}) — proceeding with max enhancement")
            # Don't reject — the enhanced image may still be readable by the VLM

        if brightness_score < 30:
            logger.warning(f"❌ Image rejected: too dark (brightness={brightness_score:.1f})")
            return OCRResponse(
                success=False,
                detected_doc_type="unknown",
                fields={},
                fraud_report=FraudReport(
                    risk_level="HIGH_RISK",
                    flags=["IMAGE_TOO_DARK"],
                    recommendation=(
                        "The image is too dark to read. "
                        "Please take the photo in a well-lit area or use your camera flash."
                    ),
                ),
                validation=ValidationResult(is_valid=False, errors=[
                    "Image is too dark. Please use better lighting or enable flash."
                ]),
                quality_score=quality_score,
            ).model_dump()

        if brightness_score > 245:
            logger.warning(f"❌ Image rejected: overexposed (brightness={brightness_score:.1f})")
            return OCRResponse(
                success=False,
                detected_doc_type="unknown",
                fields={},
                fraud_report=FraudReport(
                    risk_level="HIGH_RISK",
                    flags=["IMAGE_OVEREXPOSED"],
                    recommendation=(
                        "The image is overexposed (too bright/washed out). "
                        "Please retake the photo away from direct light and avoid glare on the document surface."
                    ),
                ),
                validation=ValidationResult(is_valid=False, errors=[
                    "Image is overexposed. Please avoid direct light and glare."
                ]),
                quality_score=quality_score,
            ).model_dump()

    except ValueError as e:
        return OCRResponse(
            success=False,
            detected_doc_type="unknown",
            fields={},
            fraud_report=FraudReport(
                risk_level="HIGH_RISK",
                flags=["INVALID_IMAGE: " + str(e)],
                recommendation="The uploaded file is not a valid image. Please upload a clear photo of the document.",
            ),
            validation=ValidationResult(is_valid=False, errors=[str(e)]),
        ).model_dump()
    except Exception as e:
        logger.error(f"Preprocessing failed: {e}")
        return OCRResponse(
            success=False,
            detected_doc_type="unknown",
            fields={},
            fraud_report=FraudReport(
                risk_level="HIGH_RISK",
                flags=[f"PREPROCESSING_ERROR: {str(e)}"],
                recommendation="Image preprocessing failed. Please try a different image.",
            ),
            validation=ValidationResult(is_valid=False, errors=[str(e)]),
        ).model_dump()

    # ============================================================
    # 2. Document Classification
    # ============================================================
    logger.info("🔍 Step 2: Classifying document type...")
    
    # Use the original (color) image for classification — VLM is better with color
    classification = classify_document(original_b64)
    detected_type = classification.get("doc_type", "unknown")
    detection_confidence = classification.get("confidence", "low")

    claimed_type = doc_type
    supported_types = {"national_id", "passport", "driver_license", "car_license"}
    requested_type = doc_type
    if requested_type == "auto":
        requested_type = detected_type
        claimed_type = detected_type  # user did not make an explicit claim

    # Process/extract using detected type when available; fallback to requested/claimed type.
    if detected_type in supported_types:
        processing_doc_type = detected_type
    elif requested_type in supported_types:
        processing_doc_type = requested_type
    else:
        logger.warning("⚠️ Could not determine document type. Falling back to national_id extraction.")
        processing_doc_type = "national_id"

    logger.info(
        f"🏷️ Claimed: {claimed_type}, Detected: {detected_type} ({detection_confidence}), "
        f"Processing as: {processing_doc_type}"
    )

    # ============================================================
    # 3. Field Extraction
    # ============================================================
    logger.info(f"📝 Step 3: Extracting fields for '{processing_doc_type}'...")
    
    # Use the COLOR-enhanced image for text extraction (preserves color cues)
    fields = extract_fields(enhanced_b64, processing_doc_type)

    if fields is None:
        # Retry with original color image (VLM might do better without enhancement)
        logger.info("🔄 Retrying extraction with original color image...")
        fields = extract_fields(original_b64, processing_doc_type)

    if fields is None:
        # Last resort: try the grayscale-enhanced image
        enhanced_gray_b64 = prep_result.get("enhanced_gray_b64")
        if enhanced_gray_b64:
            logger.info("🔄 Retrying extraction with grayscale-enhanced image...")
            fields = extract_fields(enhanced_gray_b64, processing_doc_type)

    if fields is None:
        fields = {}
        logger.warning("⚠️ Extraction returned no fields.")

    # ============================================================
    # 4. Post-Processing — Ensure kycController-compatible fields
    # ============================================================
    # The Node.js kycController expects certain field names
    if processing_doc_type == "national_id":
        # Ensure document_number is set (alias for national_id_number)
        if fields.get("national_id_number") and not fields.get("document_number"):
            fields["document_number"] = fields["national_id_number"]
    elif processing_doc_type == "passport":
        # Ensure national_id_number is set if document_number exists
        if fields.get("document_number") and not fields.get("national_id_number"):
            fields["national_id_number"] = fields["document_number"]

    # Map license_type Arabic to English for kycController
    license_type_map = {
        "خاصة": "private",
        "خاصه": "private",
        "مهنية": "professional",
        "مهنيه": "professional",
        "نقل ثقيل": "heavy_truck",
        "أتوبيس": "bus",
    }
    if processing_doc_type == "driver_license" and fields.get("license_type"):
        lt = fields["license_type"].strip()
        if lt in license_type_map:
            fields["license_type"] = license_type_map[lt]

    # Count expected fields BEFORE injecting backward-compatible keys
    filled_expected, total_expected = _count_expected_fields(fields, processing_doc_type)
    logger.info(f"📊 Expected fields filled: {filled_expected}/{total_expected}")

    # Backward-compatible keys expected by Node.js kycController.
    for required_key in [
        "national_id_number",
        "document_number",
        "license_number",
        "plate_number",
        "chassis_number",
    ]:
        fields.setdefault(required_key, None)

    logger.info(f"✅ Extracted {len(fields)} fields: {list(fields.keys())}")

    # ============================================================
    # 5. Validation
    # ============================================================
    logger.info("✔️ Step 4: Running Egyptian validation rules...")
    validation_result = validate_document(processing_doc_type, fields)
    logger.info(f"📋 Validation: valid={validation_result['is_valid']}, errors={validation_result['errors']}")

    # ============================================================
    # 6. Fraud Detection
    # ============================================================
    run_fraud_check = True
    should_check_fraud = True
    
    if should_check_fraud:
        logger.info("🔒 Step 5: Running fraud detection...")
        fraud_result = assess_fraud(
            fields=fields,
            doc_type=processing_doc_type,
            claimed_doc_type=claimed_type,
            detected_doc_type=detected_type,
            detection_confidence=detection_confidence,
            validation_result=validation_result,
            image_quality_score=quality_score,
            expected_field_counts=(filled_expected, total_expected),
        )
    else:
        fraud_result = {
            "risk_level": "CLEAN",
            "flags": [],
            "recommendation": "Fraud check was not requested.",
        }

    # ============================================================
    # 7. Build Response
    # ============================================================
    # Determine success using expected fields, not all fields (including injected None keys)
    success = filled_expected >= 2  # At least 2 expected fields extracted

    response = OCRResponse(
        success=success,
        detected_doc_type=processing_doc_type,
        fields=fields,
        fraud_report=FraudReport(**fraud_result),
        validation=ValidationResult(**validation_result),
        quality_score=quality_score,
    )

    logger.info(
        f"{'✅' if success else '❌'} Scan complete: "
        f"success={success}, type={detected_type}, "
        f"risk={fraud_result['risk_level']}, "
        f"fields={filled_expected}/{total_expected}"
    )

    return response.model_dump()


# ============================================================
# Entry Point
# ============================================================
if __name__ == "__main__":
    logger.info("🚀 Starting Egyptian Document OCR Service on port 8000...")
    logger.info("📋 Endpoint: POST http://localhost:8000/api/ocr/scan")
    logger.info("🔗 Health: GET http://localhost:8000/")

    # Check Ollama on startup
    if is_ollama_ready():
        logger.info("✅ Ollama is ready with Qwen2.5-VL model.")
    else:
        logger.warning(
            "⚠️ Ollama is NOT ready! The service will start but requests will fail.\n"
            "   → Make sure Ollama is running: ollama serve\n"
            "   → Pull the model: ollama pull qwen2.5vl:7b"
        )

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
    )
