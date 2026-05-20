"""
Pydantic schemas for Egyptian document OCR extraction.
Each schema defines the fields we expect from each document type,
plus the response envelope that the Node.js kycController expects.
"""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional


# ============================================================
# Document Field Schemas
# ============================================================

class NationalIDFields(BaseModel):
    """Egyptian National ID card fields."""
    full_name_ar: Optional[str] = Field(None, description="Full name in Arabic")
    full_name_en: Optional[str] = Field(None, description="Full name in English (if present)")
    national_id_number: Optional[str] = Field(None, description="14-digit national ID number")
    date_of_birth: Optional[str] = Field(None, description="Date of birth (YYYY-MM-DD)")
    gender: Optional[str] = Field(None, description="male or female")
    address: Optional[str] = Field(None, description="Address in Arabic")
    marital_status: Optional[str] = Field(None, description="Marital status")
    religion: Optional[str] = Field(None, description="Religion")
    occupation: Optional[str] = Field(None, description="Occupation / Job title")
    issue_date: Optional[str] = Field(None, description="Card issue date")
    expiry_date: Optional[str] = Field(None, description="Card expiry date")
    # Alias for kycController compatibility
    document_number: Optional[str] = Field(None, description="Alias → same as national_id_number")


class PassportFields(BaseModel):
    """Egyptian Passport fields."""
    full_name_ar: Optional[str] = Field(None, description="Full name in Arabic")
    full_name_en: Optional[str] = Field(None, description="Full name in English")
    document_number: Optional[str] = Field(None, description="Passport number")
    nationality: Optional[str] = Field(None, description="Nationality")
    date_of_birth: Optional[str] = Field(None, description="Date of birth (YYYY-MM-DD)")
    gender: Optional[str] = Field(None, description="male or female")
    place_of_birth: Optional[str] = Field(None, description="Place of birth")
    issue_date: Optional[str] = Field(None, description="Passport issue date")
    expiry_date: Optional[str] = Field(None, description="Passport expiry date")
    # Alias for kycController compatibility
    national_id_number: Optional[str] = Field(None, description="NID if present on passport")


class DrivingLicenseFields(BaseModel):
    """Egyptian Driving License fields."""
    full_name_ar: Optional[str] = Field(None, description="Full name in Arabic")
    license_number: Optional[str] = Field(None, description="License number")
    license_type: Optional[str] = Field(None, description="private, professional, heavy_truck, or bus")
    date_of_birth: Optional[str] = Field(None, description="Date of birth")
    issue_date: Optional[str] = Field(None, description="License issue date")
    expiry_date: Optional[str] = Field(None, description="License expiry date")
    traffic_unit: Optional[str] = Field(None, description="Issuing traffic unit")
    blood_type: Optional[str] = Field(None, description="Blood type")
    national_id_number: Optional[str] = Field(None, description="National ID on the license")


class CarLicenseFields(BaseModel):
    """Egyptian Car License (Vehicle Registration) fields."""
    plate_number: Optional[str] = Field(None, description="Full plate number (digits)")
    plate_letters_ar: Optional[str] = Field(None, description="Plate letters in Arabic")
    chassis_number: Optional[str] = Field(None, description="Chassis / VIN number")
    engine_number: Optional[str] = Field(None, description="Engine number")
    vehicle_make: Optional[str] = Field(None, description="Vehicle manufacturer")
    vehicle_model: Optional[str] = Field(None, description="Vehicle model name")
    vehicle_year: Optional[str] = Field(None, description="Model year")
    vehicle_color: Optional[str] = Field(None, description="Vehicle color")
    owner_name_ar: Optional[str] = Field(None, description="Owner name in Arabic")
    license_expiry: Optional[str] = Field(None, description="License expiry date")


# ============================================================
# Fraud & Validation Envelope
# ============================================================

class FraudReport(BaseModel):
    """Fraud detection results."""
    risk_level: str = Field("CLEAN", description="CLEAN, MEDIUM_RISK, or HIGH_RISK")
    flags: list[str] = Field(default_factory=list, description="List of fraud flags")
    recommendation: str = Field("", description="Human-readable recommendation")


class ValidationResult(BaseModel):
    """Document validation results."""
    is_valid: bool = Field(True, description="Whether the document passes validation")
    errors: list[str] = Field(default_factory=list, description="List of validation errors")


class OCRResponse(BaseModel):
    """
    Top-level response returned to the Node.js kycController.
    Matches the exact shape expected by:
      const { success, fields, fraud_report, validation } = pythonResponse.data;
    """
    success: bool = True
    detected_doc_type: str = Field("unknown", description="Auto-detected document type")
    fields: dict = Field(default_factory=dict, description="Extracted document fields")
    fraud_report: FraudReport = Field(default_factory=FraudReport)
    validation: ValidationResult = Field(default_factory=ValidationResult)
    quality_score: Optional[float] = Field(None, description="Image quality score")
