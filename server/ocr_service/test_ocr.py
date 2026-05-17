"""
Test script for the Egyptian Document OCR service.
Creates a synthetic test document image and sends it to the OCR endpoint.
"""

import requests
import json
import sys
import numpy as np
import cv2
import os

OCR_URL = "http://localhost:8000/api/ocr/scan"


def create_test_national_id_image():
    """Create a synthetic Egyptian National ID card image for testing."""
    # Create a card-sized image (856 x 540 - standard ID ratio)
    img = np.ones((540, 856, 3), dtype=np.uint8) * 240  # Light gray background
    
    # Add a colored header band (Egyptian flag colors hint)
    cv2.rectangle(img, (0, 0), (856, 80), (50, 50, 150), -1)  # Dark red header
    
    # Add "Arab Republic of Egypt" header text (English since Arabic rendering needs special fonts)
    cv2.putText(img, "Arab Republic of Egypt", (200, 55), 
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
    
    # Add a photo placeholder box
    cv2.rectangle(img, (30, 100), (220, 320), (200, 200, 200), -1)
    cv2.rectangle(img, (30, 100), (220, 320), (100, 100, 100), 2)
    cv2.putText(img, "PHOTO", (85, 220), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (100, 100, 100), 2)
    
    # Add National ID fields - simulated Arabic text with transliteration
    y_start = 120
    fields = [
        ("Name:", "Mohamed Ahmed Ali"),
        ("National ID:", "29901011234567"),
        ("Date of Birth:", "1999-01-01"),
        ("Gender:", "Male"),
        ("Address:", "Cairo, Nasr City"),
        ("Religion:", "Muslim"),
        ("Marital Status:", "Single"),
        ("Occupation:", "Engineer"),
        ("Issue Date:", "2020-06-15"),
        ("Expiry Date:", "2027-06-15"),
    ]
    
    for i, (label, value) in enumerate(fields):
        y = y_start + i * 38
        cv2.putText(img, label, (250, y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (80, 80, 80), 1)
        cv2.putText(img, value, (450, y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    
    # Add the NID number prominently at the bottom
    cv2.rectangle(img, (30, 460), (826, 520), (230, 230, 245), -1)
    cv2.putText(img, "National ID Number: 29901011234567", (100, 500), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 120), 2)
    
    # Add border
    cv2.rectangle(img, (2, 2), (854, 538), (100, 100, 100), 3)
    
    # Save
    path = os.path.join(os.path.dirname(__file__), "test_national_id.jpg")
    cv2.imwrite(path, img)
    return path


def test_scan(image_path, doc_type="national_id"):
    """Send an image to the OCR endpoint and print results."""
    print(f"\n{'='*60}")
    print(f"Testing: {doc_type} with {image_path}")
    print(f"{'='*60}")
    
    with open(image_path, "rb") as f:
        files = {"file": (os.path.basename(image_path), f, "image/jpeg")}
        data = {
            "doc_type": doc_type,
            "run_fraud_check": "true",
        }
        
        try:
            resp = requests.post(OCR_URL, files=files, data=data, timeout=300)
            result = resp.json()
            
            print(f"\nStatus Code: {resp.status_code}")
            print(f"Success: {result.get('success')}")
            print(f"Detected Type: {result.get('detected_doc_type')}")
            
            print(f"\n--- Extracted Fields ---")
            fields = result.get("fields", {})
            for key, value in fields.items():
                if value is not None and str(value).strip() and str(value).lower() != "null":
                    print(f"  {key}: {value}")
            
            print(f"\n--- Fraud Report ---")
            fraud = result.get("fraud_report", {})
            print(f"  Risk Level: {fraud.get('risk_level')}")
            if fraud.get("flags"):
                for flag in fraud["flags"]:
                    print(f"  Flag: {flag}")
            print(f"  Recommendation: {fraud.get('recommendation', 'N/A')}")
            
            print(f"\n--- Validation ---")
            validation = result.get("validation", {})
            print(f"  Valid: {validation.get('is_valid')}")
            if validation.get("errors"):
                for err in validation["errors"]:
                    print(f"  Error: {err}")
            
            return result
            
        except requests.exceptions.Timeout:
            print("ERROR: Request timed out (300s). The model may need more time on CPU.")
            return None
        except Exception as e:
            print(f"ERROR: {e}")
            return None


def test_auto_classification(image_path):
    """Test with doc_type=auto to see if classification works."""
    print(f"\n{'='*60}")
    print(f"Testing auto-classification with {image_path}")
    print(f"{'='*60}")
    
    with open(image_path, "rb") as f:
        files = {"file": (os.path.basename(image_path), f, "image/jpeg")}
        data = {
            "doc_type": "auto",
            "run_fraud_check": "true",
        }
        
        try:
            resp = requests.post(OCR_URL, files=files, data=data, timeout=300)
            result = resp.json()
            print(f"Detected Type: {result.get('detected_doc_type')}")
            print(f"Success: {result.get('success')}")
            print(f"Risk Level: {result.get('fraud_report', {}).get('risk_level')}")
            return result
        except Exception as e:
            print(f"ERROR: {e}")
            return None


if __name__ == "__main__":
    print("Egyptian Document OCR - Test Suite")
    print("=" * 60)
    
    # 1. Health check
    try:
        health = requests.get("http://localhost:8000/").json()
        print(f"Service Status: {health['status']}")
        print(f"Ollama Ready: {health['ollama_ready']}")
        print(f"Model: {health['model']}")
    except Exception as e:
        print(f"Service not running: {e}")
        sys.exit(1)
    
    # 2. Create test image
    print("\nCreating test National ID image...")
    test_img = create_test_national_id_image()
    print(f"Created: {test_img}")
    
    # 3. Test with specified doc_type
    result1 = test_scan(test_img, "national_id")
    
    # 4. Test auto-classification
    result2 = test_auto_classification(test_img)
    
    print(f"\n{'='*60}")
    print("Test suite complete!")
    print(f"{'='*60}")
