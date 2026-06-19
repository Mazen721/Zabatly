const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // 1. Vehicle Info (Optional if booking just a driver)
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  
  // 2. People Involved
  renter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The Car Owner
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The Freelance Driver (if applicable)

  // 3. Booking Details
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  rentalPrice: { type: Number, default: 0 },
  serviceFee: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid',
  },
  payoutStatus: {
    type: String,
    enum: ['not_ready', 'pending', 'sent'],
    default: 'not_ready',
  },
  payoutAmount: { type: Number, default: 0 },
  payoutSentAt: { type: Date, default: null },
  payoutSentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'expired'], 
    default: 'pending' 
  },

  // 4. Driver Specific Logic
  withDriver: { type: Boolean, default: false }, // TRUE if using the Owner's provided driver
  routeDescription: { type: String }, // Used when requesting a Freelance Driver

  // 5. Handshake Logic (Both must be true to complete the ride)
  renterFinished: { type: Boolean, default: false },
  driverFinished: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
