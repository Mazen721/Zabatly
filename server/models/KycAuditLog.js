const mongoose = require('mongoose');

const kycAuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  doc_type: {
    type: String,
    required: true,
  },
  provider: {
    type: String,
    enum: ['python_ocr', 'gemini'],
    default: 'python_ocr',
  },
  confidence_score: {
    type: Number,
    default: null,
  },
  result: {
    type: String,
    enum: ['verified', 'rejected', 'pending', 'manual_review', 'error'],
    required: true,
  },
  risk_level: {
    type: String,
    enum: ['CLEAN', 'MEDIUM_RISK', 'HIGH_RISK'],
    default: 'CLEAN',
  },
  fraud_flags: {
    type: [String],
    default: [],
  },
  validation_errors: {
    type: [String],
    default: [],
  },
  ip_address: {
    type: String,
    default: '',
  },
  user_agent: {
    type: String,
    default: '',
  },
  document_number_hash: {
    type: String,
    default: null,
  },
  quality_score: {
    type: Number,
    default: null,
  },
}, {
  timestamps: true,  // adds createdAt and updatedAt
});

// Index for admin queries
kycAuditLogSchema.index({ createdAt: -1 });
kycAuditLogSchema.index({ userId: 1, createdAt: -1 });
kycAuditLogSchema.index({ result: 1, createdAt: -1 });

module.exports = mongoose.model('KycAuditLog', kycAuditLogSchema);
