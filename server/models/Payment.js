const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ['vodafone_cash', 'instapay', 'card'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending',
    },
    proofUrl: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
