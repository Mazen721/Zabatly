const express = require('express');
const router = express.Router();

// ✅ NEW: Make sure finishRide is imported here!
const { createBooking, getMyBookings, updateBookingStatus, finishRide, checkVehicleAvailability } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { requireVerifiedKyc } = require('../middleware/kycMiddleware');
const { uploadPaymentProof } = require('../middleware/uploadMiddleware');

// Public route to check reserved vehicle dates
router.get('/availability', checkVehicleAvailability);

// Route to create a new booking
router.post('/', protect, uploadPaymentProof, createBooking);

// Route to get all bookings for the logged-in user (Renter, Owner, or Driver)
router.get('/', protect, getMyBookings);

// ✅ NEW: This MUST go before the '/:id' route so Express doesn't get confused
router.put('/finish/:id', protect, finishRide);

// Route to update booking status (Accept/Decline)
router.put('/:id', protect, updateBookingStatus);

module.exports = router;
