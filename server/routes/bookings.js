const express = require('express');
const router = express.Router();

// ✅ NEW: Make sure finishRide is imported here!
const { createBooking, getMyBookings, updateBookingStatus, finishRide, checkVehicleAvailability, markPayoutSent } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { requireVerifiedKyc } = require('../middleware/kycMiddleware');
const { uploadPaymentProof } = require('../middleware/uploadMiddleware');

// Public route to check reserved vehicle dates
router.get('/availability', checkVehicleAvailability);

// Route to create a new booking
router.post('/', protect, uploadPaymentProof, requireVerifiedKyc, createBooking);

// Route to get all bookings for the logged-in user (Renter, Owner, or Driver)
router.get('/', protect, getMyBookings);

// ✅ NEW: This MUST go before the '/:id' route so Express doesn't get confused
router.put('/finish/:id', protect, requireVerifiedKyc, finishRide);
router.patch('/:id/payout', protect, markPayoutSent);

// Route to update booking status (Accept/Decline)
// Drivers must be able to decline an incoming request. The controller applies
// the stricter driving-license check when a driver accepts or starts a ride.
router.put('/:id', protect, updateBookingStatus);

module.exports = router;
