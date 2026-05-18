const Payment = require('../models/Payment');
const Booking = require('../models/booking');
const { createNotification } = require('../utils/notificationHelper');

const adminGuard = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

const VALID_METHODS = new Set(['vodafone_cash', 'instapay', 'card']);

const attachPaymentsToBookings = async (bookings) => {
  if (!bookings || bookings.length === 0) return bookings;
  const ids = bookings.map((b) => b._id);
  const payments = await Payment.find({ bookingId: { $in: ids } }).lean();
  const byBooking = new Map(payments.map((p) => [p.bookingId.toString(), p]));
  return bookings.map((b) => {
    const plain = typeof b.toObject === 'function' ? b.toObject() : { ...b };
    plain.payment = byBooking.get(String(plain._id)) || null;
    return plain;
  });
};

/**
 * Used by bookingController after a booking is saved.
 * @returns {Promise<import('mongoose').Document|null>}
 */
const createPaymentForBooking = async ({ bookingId, userId, amount, method, proofUrl }) => {
  if (!method || !VALID_METHODS.has(method)) return null;
  const existing = await Payment.findOne({ bookingId });
  if (existing) return existing;
  return Payment.create({
    bookingId,
    userId,
    amount: Number(amount) || 0,
    method,
    status: 'pending',
    proofUrl: proofUrl || null,
  });
};

// @desc    Create a payment for a booking (optional proof file)
// @route   POST /api/payments
const createPayment = async (req, res) => {
  try {
    const { bookingId, amount, method } = req.body;
    if (!bookingId || amount === undefined || amount === '' || !method) {
      return res.status(400).json({ message: 'bookingId, amount, and method are required.' });
    }
    if (!VALID_METHODS.has(method)) {
      return res.status(400).json({ message: 'Invalid payment method.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the renter can create a payment for this booking.' });
    }

    const existing = await Payment.findOne({ bookingId: booking._id });
    if (existing) {
      return res.status(409).json({ message: 'A payment already exists for this booking.' });
    }

    const payment = await Payment.create({
      bookingId: booking._id,
      userId: req.user._id,
      amount: Number(amount),
      method,
      status: 'pending',
      proofUrl: req.file ? req.file.path : null,
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Could not create payment', error: error.message });
  }
};

// @desc    List payments for the logged-in user
// @route   GET /api/payments/my
const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate('bookingId', 'status totalPrice startDate endDate vehicle')
      .sort({ createdAt: -1 })
      .lean();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Admin: set payment status to confirmed or failed
// @route   PATCH /api/payments/:id/status
const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'failed'].includes(status)) {
      return res.status(400).json({ message: 'status must be confirmed or failed.' });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    payment.status = status;
    await payment.save();

    const booking = await Booking.findById(payment.bookingId);
    if (booking) {
      if (status === 'confirmed') {
        booking.paymentStatus = 'paid';
        await createNotification(
          payment.userId,
          'Your payment has been confirmed.',
          'payment_confirmed'
        );
      } else if (status === 'failed') {
        booking.paymentStatus = 'unpaid';
      }
      await booking.save();
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

// @desc    Get payment for a booking (renter, owner, or admin)
// @route   GET /api/payments/booking/:bookingId
const getPaymentByBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const uid = req.user._id.toString();
    const renterMatch = booking.renter && booking.renter.toString() === uid;
    const ownerMatch = booking.owner && booking.owner.toString() === uid;
    const isAdmin = req.user.role === 'admin';

    if (!renterMatch && !ownerMatch && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this payment.' });
    }

    const payment = await Payment.findOne({ bookingId: booking._id }).lean();
    res.json(payment || null);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createPayment,
  getMyPayments,
  updatePaymentStatus,
  getPaymentByBooking,
  createPaymentForBooking,
  attachPaymentsToBookings,
  adminGuard,
};
