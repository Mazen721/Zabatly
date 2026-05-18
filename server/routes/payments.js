const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadPaymentProof } = require('../middleware/uploadMiddleware');
const {
  createPayment,
  getMyPayments,
  updatePaymentStatus,
  getPaymentByBooking,
  adminGuard,
} = require('../controllers/paymentController');

router.post('/', protect, uploadPaymentProof, createPayment);
router.get('/my', protect, getMyPayments);
router.get('/booking/:bookingId', protect, getPaymentByBooking);
router.patch('/:id/status', protect, adminGuard, updatePaymentStatus);

module.exports = router;
