"""
OpenCV-based image preprocessing pipeline for document OCR.
Enhances image quality before sending to the VLM for text extraction.

v2 — Preserves color information for better VLM accuracy.
     Adds LAB-based enhancement, EXIF auto-rotation, and adaptive processing.
"""

import cv2
import numpy as np
import base64
import logging

logger = logging.getLogger(__name__)


def load_image(file_bytes: bytes) -> np.ndarray:
    """Load an image from raw bytes into an OpenCV BGR array."""
    nparr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image. The file may be corrupt or not an image.")
    return img


def auto_rotate_from_exif(file_bytes: bytes, img: np.ndarray) -> np.ndarray:
    """
    Auto-rotate image based on EXIF orientation tag.
    Phone photos are often stored rotated; fixing this is critical for OCR.
    """
    try:
        # Check for EXIF orientation marker in JPEG bytes
        # EXIF orientation tag: 0x0112
        # We look for the pattern in the raw bytes to avoid requiring PIL
        import struct

        if len(file_bytes) < 12:
            return img

        # Only JPEG files have EXIF
        if file_bytes[0:2] != b'\xff\xd8':
            return img

        # Search for EXIF APP1 marker
        offset = 2
        while offset < min(len(file_bytes) - 4, 65536):
            if file_bytes[offset] != 0xFF:
                break
            marker = file_bytes[offset + 1]
            if marker == 0xE1:  # APP1 (EXIF)
                # Parse EXIF to find orientation
                exif_start = offset + 4
                if file_bytes[exif_start:exif_start + 4] != b'Exif':
                    break

                tiff_start = exif_start + 6
                byte_order = file_bytes[tiff_start:tiff_start + 2]
                if byte_order == b'MM':
                    endian = '>'
                elif byte_order == b'II':
                    endian = '<'
                else:
                    break

                ifd_offset = struct.unpack(endian + 'I', file_bytes[tiff_start + 4:tiff_start + 8])[0]
                ifd_pos = tiff_start + ifd_offset
                if ifd_pos + 2 > len(file_bytes):
                    break

                num_entries = struct.unpack(endian + 'H', file_bytes[ifd_pos:ifd_pos + 2])[0]

                for i in range(min(num_entries, 50)):
                    entry_pos = ifd_pos + 2 + i * 12
                    if entry_pos + 12 > len(file_bytes):
                        break
                    tag = struct.unpack(endian + 'H', file_bytes[entry_pos:entry_pos + 2])[0]
                    if tag == 0x0112:  # Orientation tag
                        orientation = struct.unpack(endian + 'H', file_bytes[entry_pos + 8:entry_pos + 10])[0]

                        if orientation == 3:
                            img = cv2.rotate(img, cv2.ROTATE_180)
                            logger.info("🔄 Auto-rotated 180° (EXIF orientation 3)")
                        elif orientation == 6:
                            img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
                            logger.info("🔄 Auto-rotated 90° CW (EXIF orientation 6)")
                        elif orientation == 8:
                            img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
                            logger.info("🔄 Auto-rotated 90° CCW (EXIF orientation 8)")

                        return img
                break
            else:
                size = struct.unpack('>H', file_bytes[offset + 2:offset + 4])[0]
                offset += 2 + size

    except Exception as e:
        logger.debug(f"EXIF rotation check skipped: {e}")

    return img


def resize_if_needed(img: np.ndarray, max_dim: int = 2048) -> np.ndarray:
    """
    Resize image so the longest dimension is at most max_dim.
    Large images slow down VLM inference without adding accuracy.
    """
    h, w = img.shape[:2]
    if max(h, w) <= max_dim:
        return img
    scale = max_dim / max(h, w)
    new_w = int(w * scale)
    new_h = int(h * scale)
    return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)


def convert_to_grayscale(img: np.ndarray) -> np.ndarray:
    """Convert BGR image to grayscale."""
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)


def apply_clahe(gray: np.ndarray, clip_limit: float = 3.0, tile_size: int = 8) -> np.ndarray:
    """
    Apply CLAHE (Contrast Limited Adaptive Histogram Equalization).
    Critical for reading text on colored ID card backgrounds.
    """
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(tile_size, tile_size))
    return clahe.apply(gray)


def enhance_color_lab(img: np.ndarray, clip_limit: float = 3.0, tile_size: int = 8) -> np.ndarray:
    """
    Enhance contrast on the L-channel of LAB color space.
    This preserves color cues (critical for VLM document recognition)
    while still improving text contrast.
    """
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)

    # Apply CLAHE to the L (lightness) channel only
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(tile_size, tile_size))
    l_enhanced = clahe.apply(l_channel)

    # Merge back
    lab_enhanced = cv2.merge([l_enhanced, a_channel, b_channel])
    return cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)


def denoise(gray: np.ndarray, strength: int = 10) -> np.ndarray:
    """
    Apply Non-Local Means Denoising.
    Removes noise while preserving text edges.
    """
    return cv2.fastNlMeansDenoising(gray, None, h=strength, templateWindowSize=7, searchWindowSize=21)


def denoise_color(img: np.ndarray, strength: int = 10) -> np.ndarray:
    """
    Apply Non-Local Means Denoising for color images.
    Preserves color while removing noise.
    """
    return cv2.fastNlMeansDenoisingColored(img, None, h=strength, hForColorComponents=strength,
                                            templateWindowSize=7, searchWindowSize=21)


def sharpen(img: np.ndarray) -> np.ndarray:
    """
    Apply a mild sharpening kernel to make text edges crisper.
    """
    kernel = np.array([
        [0, -0.5, 0],
        [-0.5, 3, -0.5],
        [0, -0.5, 0]
    ])
    return cv2.filter2D(img, -1, kernel)


def sharpen_strong(img: np.ndarray) -> np.ndarray:
    """
    Apply a stronger sharpening kernel for borderline blurry images.
    """
    kernel = np.array([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
    ])
    return cv2.filter2D(img, -1, kernel)


def order_points(pts: np.ndarray) -> np.ndarray:
    """
    Order 4 corner points as: top-left, top-right, bottom-right, bottom-left.
    Used for perspective correction.
    """
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1)
    rect[0] = pts[np.argmin(s)]       # top-left has smallest sum
    rect[2] = pts[np.argmax(s)]       # bottom-right has largest sum
    rect[1] = pts[np.argmin(diff)]    # top-right has smallest difference
    rect[3] = pts[np.argmax(diff)]    # bottom-left has largest difference
    return rect


def perspective_correction(img: np.ndarray) -> np.ndarray:
    """
    Attempt to detect a document rectangle and warp it to a flat view.
    If no clear rectangle is found, returns the original image.
    """
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img.copy()
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)

        # Dilate edges to close gaps
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        edges = cv2.dilate(edges, kernel, iterations=1)

        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return img

        # Find the largest contour that approximates to 4 points
        contours = sorted(contours, key=cv2.contourArea, reverse=True)

        for contour in contours[:5]:  # Check top 5 largest
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.02 * peri, True)

            if len(approx) == 4:
                # Check if the contour is large enough (at least 20% of image area)
                img_area = img.shape[0] * img.shape[1]
                contour_area = cv2.contourArea(approx)

                if contour_area < 0.2 * img_area:
                    continue

                pts = order_points(approx.reshape(4, 2))
                (tl, tr, br, bl) = pts

                # Compute the width and height of the new image
                width_top = np.linalg.norm(tr - tl)
                width_bottom = np.linalg.norm(br - bl)
                max_width = int(max(width_top, width_bottom))

                height_left = np.linalg.norm(bl - tl)
                height_right = np.linalg.norm(br - tr)
                max_height = int(max(height_left, height_right))

                if max_width < 100 or max_height < 100:
                    continue

                dst = np.array([
                    [0, 0],
                    [max_width - 1, 0],
                    [max_width - 1, max_height - 1],
                    [0, max_height - 1]
                ], dtype="float32")

                M = cv2.getPerspectiveTransform(pts, dst)
                warped = cv2.warpPerspective(img, M, (max_width, max_height))
                logger.info("✅ Perspective correction applied successfully.")
                return warped

        logger.info("ℹ️ No document rectangle found — skipping perspective correction.")
        return img

    except Exception as e:
        logger.warning(f"⚠️ Perspective correction failed: {e}")
        return img


def compute_image_quality_score(gray: np.ndarray) -> float:
    """
    Compute a quality score for the image based on variance of Laplacian.
    Higher = sharper/better quality. Below ~50 is blurry.
    """
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def preprocess_image(file_bytes: bytes) -> dict:
    """
    Full preprocessing pipeline. Returns a dict with:
      - 'enhanced_b64': base64-encoded COLOR-enhanced image (PNG) for VLM
      - 'enhanced_gray_b64': base64-encoded grayscale-enhanced image (PNG) fallback
      - 'original_b64': base64-encoded original color image (PNG)
      - 'quality_score': image quality metric
      - 'brightness_score': mean brightness
      - 'quality_tier': 'good', 'borderline', or 'poor'
      - 'original_dimensions': (height, width)
    """
    # 1. Load
    original = load_image(file_bytes)
    h, w = original.shape[:2]
    logger.info(f"📸 Loaded image: {w}x{h}")

    # 1b. Auto-rotate from EXIF (phone photos)
    original = auto_rotate_from_exif(file_bytes, original)
    h, w = original.shape[:2]  # update dimensions after potential rotation

    # 2. Resize for VLM efficiency
    resized = resize_if_needed(original, max_dim=2048)

    # 3. Perspective correction (on color image)
    corrected = perspective_correction(resized)

    # 4. Grayscale for quality assessment
    gray = convert_to_grayscale(corrected)
    quality_score = compute_image_quality_score(gray)
    brightness_score = float(np.mean(gray))
    min_dimension = min(h, w)
    too_small = min_dimension < 200  # relaxed from 300

    logger.info(f"📊 Image quality score (Laplacian variance): {quality_score:.1f}")
    logger.info(f"💡 Image brightness score (mean intensity): {brightness_score:.1f}")
    logger.info(f"📐 Image min dimension: {min_dimension}px (too_small={too_small})")

    # 5. Determine quality tier for adaptive processing
    if quality_score >= 50:
        quality_tier = "good"
    elif quality_score >= 15:
        quality_tier = "borderline"
    else:
        quality_tier = "poor"

    logger.info(f"📈 Quality tier: {quality_tier}")

    # 6. COLOR-preserving enhancement pipeline (LAB-based)
    if quality_tier == "good":
        # Good quality: mild enhancement
        color_enhanced = enhance_color_lab(corrected, clip_limit=2.5, tile_size=8)
        color_enhanced = sharpen(color_enhanced)
    elif quality_tier == "borderline":
        # Borderline: stronger enhancement
        color_enhanced = enhance_color_lab(corrected, clip_limit=4.0, tile_size=8)
        color_enhanced = denoise_color(color_enhanced, strength=6)
        color_enhanced = sharpen_strong(color_enhanced)
        logger.info("🔧 Applied stronger enhancement for borderline image")
    else:
        # Poor quality: maximum enhancement, try to salvage
        color_enhanced = enhance_color_lab(corrected, clip_limit=5.0, tile_size=6)
        color_enhanced = denoise_color(color_enhanced, strength=10)
        color_enhanced = sharpen_strong(color_enhanced)
        logger.info("🔧 Applied maximum enhancement for poor quality image")

    # 7. Also prepare grayscale enhanced version as fallback
    enhanced_gray = apply_clahe(gray)
    enhanced_gray = denoise(enhanced_gray, strength=8)
    enhanced_gray = sharpen(enhanced_gray)
    enhanced_gray_bgr = cv2.cvtColor(enhanced_gray, cv2.COLOR_GRAY2BGR)

    # 8. Encode to base64 PNG
    _, color_buffer = cv2.imencode('.png', color_enhanced)
    enhanced_b64 = base64.b64encode(color_buffer).decode('utf-8')

    _, gray_buffer = cv2.imencode('.png', enhanced_gray_bgr)
    enhanced_gray_b64 = base64.b64encode(gray_buffer).decode('utf-8')

    # Also encode the original (color, resized) for the VLM
    _, orig_buffer = cv2.imencode('.png', corrected)
    original_b64 = base64.b64encode(orig_buffer).decode('utf-8')

    return {
        'enhanced_b64': enhanced_b64,
        'enhanced_gray_b64': enhanced_gray_b64,
        'original_b64': original_b64,
        'quality_score': quality_score,
        'brightness_score': brightness_score,
        'quality_tier': quality_tier,
        'min_dimension': min_dimension,
        'too_small': too_small,
        'original_dimensions': (h, w),
    }
