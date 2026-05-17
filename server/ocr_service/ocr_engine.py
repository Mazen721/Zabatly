"""
OCR Engine — uses Qwen2.5-VL via Ollama to classify documents
and extract structured Arabic text from Egyptian official documents.
"""

import requests
import json
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = "http://127.0.0.1:11434"
# Preferred order: try best VL models first, fallback to moondream for low-memory systems
MODEL_PREFERENCES = ["qwen2.5vl:3b", "qwen2.5vl:7b", "moondream:latest"]
MODEL_NAME = None  # Auto-detected at startup


def _detect_best_model() -> str:
    """Detect the best available Qwen2.5-VL model in Ollama."""
    global MODEL_NAME
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if resp.status_code == 200:
            available = [m.get("name", "") for m in resp.json().get("models", [])]
            for pref in MODEL_PREFERENCES:
                if pref in available:
                    MODEL_NAME = pref
                    logger.info(f"[OCR] Selected model: {MODEL_NAME}")
                    return MODEL_NAME
            # Check for any qwen2.5vl variant
            for m in available:
                if "qwen2.5vl" in m:
                    MODEL_NAME = m
                    logger.info(f"[OCR] Selected model (auto): {MODEL_NAME}")
                    return MODEL_NAME
    except Exception:
        pass
    MODEL_NAME = MODEL_PREFERENCES[0]  # default
    return MODEL_NAME


def _check_ollama_available() -> bool:
    """Check if Ollama is running and a suitable vision model is available."""
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if resp.status_code == 200:
            models = [m.get("name", "") for m in resp.json().get("models", [])]
            has_vl_model = any(
                any(name in m for name in ["qwen2.5vl", "moondream"])
                for m in models
            )
            if has_vl_model:
                _detect_best_model()
            else:
                logger.warning(
                    f"[OCR] No vision model found in Ollama. "
                    f"Available models: {models}. "
                    f"Run: ollama pull moondream"
                )
            return has_vl_model
        return False
    except Exception:
        return False


def _call_ollama_vision(
    system_prompt: str,
    user_prompt: str,
    image_b64: str,
    temperature: float = 0.0,
    timeout: int = 120,
) -> Optional[str]:
    """
    Call the Ollama chat API with a vision model.
    Returns the raw text content from the model response.
    Automatically falls back to smaller models on memory errors.
    """
    global MODEL_NAME
    if MODEL_NAME is None:
        _detect_best_model()

    models_to_try = [MODEL_NAME] if MODEL_NAME else []
    # Add fallbacks
    for pref in MODEL_PREFERENCES:
        if pref not in models_to_try:
            models_to_try.append(pref)

    for model in models_to_try:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": user_prompt,
                    "images": [image_b64],
                },
            ],
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": 2048,
                "num_ctx": 2048,  # Reduce context window to lower memory usage
            },
        }

        try:
            resp = requests.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json=payload,
                timeout=timeout,
            )
            
            # Handle memory errors by trying a smaller model
            if resp.status_code == 500:
                error_body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                error_msg = error_body.get("error", resp.text[:200])
                if "memory" in error_msg.lower() or "system memory" in error_msg.lower():
                    logger.warning(f"[OCR] Model '{model}' needs too much memory: {error_msg}. Trying next model...")
                    continue
                else:
                    logger.error(f"[OCR] Ollama 500 error with '{model}': {error_msg}")
                    continue
            
            resp.raise_for_status()
            data = resp.json()
            content = data.get("message", {}).get("content", "")
            
            # Update MODEL_NAME if this model worked
            if model != MODEL_NAME:
                logger.info(f"[OCR] Switched to model '{model}' (previous: {MODEL_NAME})")
                MODEL_NAME = model
            
            return content
            
        except requests.exceptions.Timeout:
            logger.error(f"[OCR] Ollama request timed out with model '{model}'.")
            return None
        except requests.exceptions.ConnectionError:
            logger.error("[OCR] Cannot connect to Ollama. Is it running?")
            return None
        except Exception as e:
            logger.error(f"[OCR] Ollama call failed with '{model}': {e}")
            continue

    logger.error("[OCR] All models failed. No Qwen2.5-VL model could process this image.")
    return None


def _parse_json_from_response(raw_text: str) -> Optional[dict]:
    """
    Parse JSON from the VLM response.
    Handles common issues: markdown code fences, trailing text, etc.
    """
    if not raw_text:
        return None

    text = raw_text.strip()

    # Remove markdown code fences if present
    # Match ```json ... ``` or ``` ... ```
    fence_pattern = r"```(?:json)?\s*\n?(.*?)\n?\s*```"
    match = re.search(fence_pattern, text, re.DOTALL)
    if match:
        text = match.group(1).strip()

    # Try direct JSON parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to find a JSON object in the text
    # Look for the first { ... } block
    brace_start = text.find("{")
    brace_end = text.rfind("}")
    if brace_start != -1 and brace_end != -1 and brace_end > brace_start:
        try:
            return json.loads(text[brace_start : brace_end + 1])
        except json.JSONDecodeError:
            pass

    logger.warning(f"⚠️ Could not parse JSON from VLM response: {text[:200]}...")
    return None


# ============================================================
# Document Classification
# ============================================================

CLASSIFICATION_SYSTEM_PROMPT = """You are an expert document classification system specialized in Egyptian official documents.
You can identify the following document types:
1. national_id - Egyptian National ID Card (بطاقة الرقم القومي)
2. passport - Egyptian Passport (جواز سفر مصري)
3. driver_license - Egyptian Driving License (رخصة قيادة مصرية)
4. car_license - Egyptian Car License / Vehicle Registration (رخصة سيارة / ترخيص مركبة)

You must respond with ONLY a valid JSON object, no other text.
"""

CLASSIFICATION_USER_PROMPT = """Look at this document image carefully.
Identify what type of Egyptian official document this is.

Return ONLY this JSON:
{"doc_type": "<one of: national_id, passport, driver_license, car_license, unknown>", "confidence": "<high, medium, or low>"}
"""


def classify_document(image_b64: str) -> dict:
    """
    Auto-detect the type of Egyptian document in the image.
    Returns {"doc_type": str, "confidence": str}.
    """
    raw = _call_ollama_vision(
        system_prompt=CLASSIFICATION_SYSTEM_PROMPT,
        user_prompt=CLASSIFICATION_USER_PROMPT,
        image_b64=image_b64,
        temperature=0.0,
    )

    result = _parse_json_from_response(raw)
    if result and "doc_type" in result:
        logger.info(f"🔍 Classified document as: {result['doc_type']} (confidence: {result.get('confidence', 'unknown')})")
        return result

    logger.warning("⚠️ Classification failed, defaulting to unknown.")
    return {"doc_type": "unknown", "confidence": "low"}


# ============================================================
# Field Extraction — Per Document Type
# ============================================================

EXTRACTION_SYSTEM_PROMPT = """You are an expert OCR system specialized in extracting text from Egyptian official documents.
You can read both Arabic (العربية) and English text accurately.
You MUST return ONLY a valid JSON object with the extracted fields.
Do NOT include any explanation, markdown formatting, or extra text.
If a field is not visible or unreadable, set its value to null.
For dates, use the format YYYY-MM-DD when possible.
Extract the text EXACTLY as written on the document — do not translate, guess, or fabricate any values."""


NATIONAL_ID_EXTRACTION_PROMPT = """This is an Egyptian National ID Card (بطاقة الرقم القومي).
Extract ALL of the following fields from this document image.

Read the Arabic text very carefully. The Egyptian National ID contains:
- Full name in Arabic (الاسم) — usually at the top
- The 14-digit National ID Number (الرقم القومي) — a long number, usually prominent
- Date of birth (تاريخ الميلاد)
- Address (العنوان)
- Gender (النوع) — ذكر for male, أنثى for female
- Marital status (الحالة الاجتماعية)
- Religion (الديانة)
- Occupation (المهنة / الوظيفة)
- Issue date (تاريخ الإصدار)
- Expiry date (تاريخ الانتهاء / صالحة حتى)

Return ONLY this JSON:
{
    "full_name_ar": "الاسم بالعربية",
    "full_name_en": "Name in English if present, else null",
    "national_id_number": "14 digit number",
    "date_of_birth": "YYYY-MM-DD",
    "gender": "male or female",
    "address": "العنوان بالعربية",
    "marital_status": "الحالة الاجتماعية",
    "religion": "الديانة",
    "occupation": "المهنة",
    "issue_date": "YYYY-MM-DD",
    "expiry_date": "YYYY-MM-DD"
}"""


PASSPORT_EXTRACTION_PROMPT = """This is an Egyptian Passport (جواز سفر مصري).
Extract ALL of the following fields from this document image.

Read both Arabic and English text carefully. An Egyptian passport contains:
- Full name in Arabic and English
- Passport number (رقم الجواز) — usually starts with A followed by digits
- Nationality (الجنسية)
- Date of birth (تاريخ الميلاد)
- Gender (النوع)
- Place of birth (محل الميلاد)
- Issue date (تاريخ الإصدار)
- Expiry date (تاريخ الانتهاء)

Return ONLY this JSON:
{
    "full_name_ar": "الاسم بالعربية",
    "full_name_en": "Name in English",
    "document_number": "Passport number",
    "nationality": "Nationality",
    "date_of_birth": "YYYY-MM-DD",
    "gender": "male or female",
    "place_of_birth": "Place of birth",
    "issue_date": "YYYY-MM-DD",
    "expiry_date": "YYYY-MM-DD"
}"""


DRIVING_LICENSE_EXTRACTION_PROMPT = """This is an Egyptian Driving License (رخصة قيادة مصرية).
Extract ALL of the following fields from this document image.

Read the Arabic text carefully. An Egyptian driving license contains:
- Full name in Arabic (الاسم)
- License number (رقم الرخصة)
- License type (نوع الرخصة) — خاصة (private), مهنية (professional), نقل ثقيل (heavy_truck), أتوبيس (bus)
- Date of birth (تاريخ الميلاد)
- Issue date (تاريخ الإصدار)
- Expiry date (تاريخ الانتهاء)
- Traffic unit (وحدة المرور)
- Blood type (فصيلة الدم)
- National ID number if present

Return ONLY this JSON:
{
    "full_name_ar": "الاسم بالعربية",
    "license_number": "License number",
    "license_type": "private, professional, heavy_truck, or bus",
    "date_of_birth": "YYYY-MM-DD",
    "issue_date": "YYYY-MM-DD",
    "expiry_date": "YYYY-MM-DD",
    "traffic_unit": "اسم وحدة المرور",
    "blood_type": "Blood type like A+, B-, O+, etc.",
    "national_id_number": "14 digit NID if visible"
}"""


CAR_LICENSE_EXTRACTION_PROMPT = """This is an Egyptian Car License / Vehicle Registration (رخصة سيارة / ترخيص مركبة).
Extract ALL of the following fields from this document image.

Read the Arabic text carefully. An Egyptian car license contains:
- Plate number (رقم اللوحة) — digits part
- Plate letters in Arabic (حروف اللوحة) — Arabic letters on the plate
- Chassis number (رقم الشاسيه) — usually 17 characters
- Engine number (رقم المحرك / الموتور)
- Vehicle make/manufacturer (الماركة) — e.g., تويوتا, بي ام دبليو
- Vehicle model (الموديل / الطراز)
- Model year (سنة الصنع)
- Vehicle color (اللون)
- Owner name in Arabic (اسم المالك)
- License expiry date (تاريخ انتهاء الترخيص)

Return ONLY this JSON:
{
    "plate_number": "digits of plate number",
    "plate_letters_ar": "Arabic plate letters",
    "chassis_number": "17-character chassis/VIN",
    "engine_number": "Engine number",
    "vehicle_make": "Manufacturer name",
    "vehicle_model": "Model name",
    "vehicle_year": "Year",
    "vehicle_color": "Color",
    "owner_name_ar": "اسم المالك بالعربية",
    "license_expiry": "YYYY-MM-DD"
}"""


_EXTRACTION_PROMPTS = {
    "national_id": NATIONAL_ID_EXTRACTION_PROMPT,
    "passport": PASSPORT_EXTRACTION_PROMPT,
    "driver_license": DRIVING_LICENSE_EXTRACTION_PROMPT,
    "car_license": CAR_LICENSE_EXTRACTION_PROMPT,
}


def extract_fields(image_b64: str, doc_type: str) -> Optional[dict]:
    """
    Extract structured fields from a document image based on its type.
    Uses document-specific prompts for maximum accuracy.
    Returns a dict of extracted fields, or None on failure.
    """
    prompt = _EXTRACTION_PROMPTS.get(doc_type)
    if not prompt:
        logger.error(f"❌ No extraction prompt for doc_type: {doc_type}")
        return None

    raw = _call_ollama_vision(
        system_prompt=EXTRACTION_SYSTEM_PROMPT,
        user_prompt=prompt,
        image_b64=image_b64,
        temperature=0.0,
        timeout=180,  # Give more time for extraction
    )

    result = _parse_json_from_response(raw)
    if result:
        logger.info(f"✅ Extracted {len(result)} fields from {doc_type}")
        return result

    logger.warning(f"⚠️ Field extraction failed for {doc_type}")
    return None


def is_ollama_ready() -> bool:
    """Check if Ollama is running and the model is available."""
    return _check_ollama_available()
