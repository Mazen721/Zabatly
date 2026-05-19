const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'agency', 'driver', 'admin'], default: 'user' },
  phone: { type: String, default: '' },
  is_verified: { type: Boolean, default: false }, // Email/Phone basic verification
  
  // ==========================================
  // NEW: Strict KYC / Identity Verification
  // ==========================================
  kyc_status: { 
    type: String, 
    enum: ['unsubmitted', 'pending', 'verified', 'rejected'], 
    default: 'unsubmitted' 
  },
  
  // Stores OCR data from National ID or Passport (Required for ALL roles to transact)
  identity_document: {
    doc_type: { type: String, enum: ['national_id', 'passport', null], default: null },
    document_number: { type: String, default: null },
    document_url: { type: String, default: '' },
    extracted_data: { type: mongoose.Schema.Types.Mixed, default: {} }, // Saves the raw Python JSON
    verified_at: { type: Date, default: null }
  },

  // Stores OCR data from Driver's License (Required ONLY for 'driver' role)
  driving_license: {
    license_number: { type: String, default: null },
    document_url: { type: String, default: '' },
    extracted_data: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['unsubmitted', 'pending', 'verified', 'rejected'],
      default: 'unsubmitted'
    },
    is_verified: { type: Boolean, default: false },
    verified_at: { type: Date, default: null }
  },

  // ==========================================
  // Driver Specific Fields
  // ==========================================
  isAvailable: { type: Boolean, default: true },
  driverStatus: {
    type: String,
    enum: ['online', 'busy', 'offline'],
    default: 'online',
  },
  dailyRate: { type: Number, default: 200 }, 
  currentRide: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  currentLocation: { type: String, default: '' },
  coveredAreas: [{ type: String }],
  availability: { type: String, default: '' },
  drivingExperience: { type: String, default: '' },
  vehicleTypes: [{ type: String }],
  licenseInfo: { type: String, default: '' },
  languagesSpoken: [{ type: String }],
  contactDetails: { type: String, default: '' },
  
  // ==========================================
  // Trust & Safety Profile
  // ==========================================
  profilePicture: { type: String, default: '' },
  profilePhoto: { type: String, default: '' },
  age: { type: Number },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['', 'male', 'female', 'other', 'prefer_not_to_say'], default: '' },
  city: { type: String, default: '' },
  nationality: { type: String, default: '' },
  preferredLanguage: { type: String, default: 'English' },
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    relation: { type: String, default: '' },
  },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
