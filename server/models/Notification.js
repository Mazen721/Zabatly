const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'booking_confirmed',
      'booking_cancelled',
      'booking_completed',
      'kyc_approved',
      'kyc_rejected',
      'payment_confirmed',
      'new_booking_request',
      'driver_request',
    ],
    required: true,
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);
