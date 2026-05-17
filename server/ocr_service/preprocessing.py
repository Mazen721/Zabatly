"""
OpenCV-based image preprocessing pipeline for document OCR.
Enhances image quality before sending to the VLM for text extraction.
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


def denoise(gray: np.ndarray, strength: int = 10) -> np.ndarray:
    """
    Apply Non-Local Means Denoising.
    Removes noise while preserving text edges.
    """
    return cv2.fastNlMeansDenoising(gray, None, h=strength, templateWindowSize=7, searchWindowSize=21)


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
      - 'enhanced_b64': base64-encoded enhanced image (PNG) for VLM
      - 'quality_score': image quality metric
      - 'original_dimensions': (height, width)
    """
    # 1. Load
    original = load_image(file_bytes)
    h, w = original.shape[:2]
    logger.info(f"📸 Loaded image: {w}x{h}")

    # 2. Resize for VLM efficiency
    resized = resize_if_needed(original, max_dim=2048)

    # 3. Perspective correction (on color image)
    corrected = perspective_correction(resized)

    # 4. Grayscale for quality assessment
    gray = convert_to_grayscale(corrected)
    quality_score = compute_image_quality_score(gray)
    logger.info(f"📊 Image quality score (Laplacian variance): {quality_score:.1f}")

    # 5. Enhancement pipeline
    enhanced_gray = apply_clahe(gray)
    enhanced_gray = denoise(enhanced_gray, strength=8)
    enhanced_gray = sharpen(enhanced_gray)

    # 6. Convert back to 3-channel for VLM (some VLMs prefer color/3-channel)
    enhanced_bgr = cv2.cvtColor(enhanced_gray, cv2.COLOR_GRAY2BGR)

    # 7. Encode to base64 PNG
    _, buffer = cv2.imencode('.png', enhanced_bgr)
    enhanced_b64 = base64.b64encode(buffer).decode('utf-8')

    # Also encode the original (color, resized) for the VLM
    # VLMs often do better with color images for classification
    _, orig_buffer = cv2.imencode('.png', corrected)
    original_b64 = base64.b64encode(orig_buffer).decode('utf-8')

    return {
        'enhanced_b64': enhanced_b64,
        'original_b64': original_b64,
        'quality_score': quality_score,
        'original_dimensions': (h, w),
    }
