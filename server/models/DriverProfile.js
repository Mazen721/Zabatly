const mongoose = require('mongoose');

const driverProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Specifics for the job
  license_type: { 
    type: String, 
    enum: ['private', 'professional', 'heavy_truck', 'bus'], 
    required: true 
  },
  years_experience: { type: Number, required: true },
  hourly_rate: { type: Number, required: true },
  
  // Where can they work? (e.g., "Cairo", "Giza")
  city: { type: String, required: true },

  // Verification
  license_document: { type: String }, // URL to image
  is_active: { type: Boolean, default: true },
  
  rating: { type: Number, default: 5.0 }
}, { timestamps: true });

module.exports = mongoose.model('DriverProfile', driverProfileSchema);
