const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }, // The person writing the review
  
  targetUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }, // Populate this if reviewing a Driver, Owner, or Renter
  
  targetVehicle: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle' 
  }, // Populate this if reviewing a Car
  
  bookingReference: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking',
    required: true
  }, // Proof that they actually interacted!
  
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  
  comment: { 
    type: String, 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);