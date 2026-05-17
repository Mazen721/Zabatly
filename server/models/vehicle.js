const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  type: {
    type: String,
    required: true,
    // ✅ FIX 1: Aligned enum strictly with the frontend dropdown values
    enum: ['sedan', 'suv', 'luxury', 'minibus'], 
  },
  capacity: { type: Number, required: true },
  price_per_day: { type: Number, required: true },
  transmission: {
    type: String,
    required: true,
    enum: ['automatic', 'manual'],
  },
  fuel: { 
    type: String, 
    required: true,
    // ✅ FIX 2: Added strict enum for fuel types to match frontend
    enum: ['petrol', 'diesel', 'electric', 'hybrid'],
  },
  // ✅ FIX 3: Changed to Boolean because frontend sends a true/false checkbox value
  ac: { type: Boolean, required: true }, 
  description: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  has_driver: { type: Boolean, default: false },
  driver_cost: { type: Number, default: 0 },
  images: { type: [String], required: true }, 
  isAvailable: { type: Boolean, default: true },

  // ==========================================
  // NEW: Vehicle KYC & Registration Verification
  // ==========================================
  kyc_status: { 
    type: String, 
    enum: ['unsubmitted', 'pending', 'verified', 'rejected'], 
    default: 'unsubmitted' 
  },
  car_license: {
    plate_number: { type: String, default: null },
    chassis_number: { type: String, default: null },
    extracted_data: { type: mongoose.Schema.Types.Mixed, default: {} }, 
    verified_at: { type: Date, default: null }
  },

  // ==========================================
  // Ratings
  // ==========================================
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 }

}, { timestamps: true });

const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);
module.exports = Vehicle;