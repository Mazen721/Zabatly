const mongoose = require('mongoose');

const kycAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  doc_type: {
    type: String,
    required: true,
    enum: ['national_id', 'passport', 'driver_license', 'car_license'],
  },
  result: {
    type: String,
    required: true,
    enum: ['verified', 'rejected', 'pending', 'manual_review', 'error'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400,  // TTL: auto-delete after 24 hours
  },
});

// Compound index for efficient retry-limit queries
kycAttemptSchema.index({ userId: 1, doc_type: 1, createdAt: 1 });

module.exports = mongoose.model('KycAttempt', kycAttemptSchema);
