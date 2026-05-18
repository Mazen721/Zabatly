const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Vehicle = require('../models/vehicle');
const Booking = require('../models/booking');
const Review = require('../models/Review');
const { protect } = require('../middleware/authMiddleware');
const { attachPaymentsToBookings } = require('../controllers/paymentController');

const adminGuard = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

// @route   GET /api/admin/pending
router.get('/pending', protect, adminGuard, async (req, res) => {
  try {
    // Added .lean() to guarantee the admin can see the raw data too
    const identity = await User.find({ kyc_status: 'pending' }).select('name email identity_document').lean();
    
    // ✅ FIX 4: Corrected query path for driving license status
    const licenses = await User.find({ 'driving_license.status': 'pending' }).select('name email driving_license').lean();
    
    const vehicles = await Vehicle.find({ kyc_status: 'pending' }).populate('owner', 'name email').select('make model year car_license owner').lean();
    
    res.json({ identity, licenses, vehicles });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/admin/overview
router.get('/overview', protect, adminGuard, async (req, res) => {
  try {
    const [users, vehicles, bookings, reviews] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).lean(),
      Vehicle.find()
        .populate('owner', 'name email role kyc_status is_verified')
        .sort({ createdAt: -1 })
        .lean(),
      Booking.find()
        .populate('renter', 'name email role')
        .populate('owner', 'name email role')
        .populate('driver', 'name email role isAvailable')
        .populate('vehicle', 'make model year type price_per_day isAvailable')
        .sort({ createdAt: -1 })
        .lean(),
      Review.find()
        .populate('author', 'name email')
        .populate('targetUser', 'name email role')
        .populate('targetVehicle', 'make model year')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const countBy = (items, key, fallback = 'unknown') =>
      items.reduce((acc, item) => {
        const value = item[key] || fallback;
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {});

    const completedBookings = bookings.filter((booking) => booking.status === 'completed');
    const stats = {
      users: {
        total: users.length,
        byRole: countBy(users, 'role'),
        verified: users.filter((user) => user.kyc_status === 'verified').length,
        pendingKyc: users.filter((user) => user.kyc_status === 'pending').length,
      },
      drivers: {
        total: users.filter((user) => user.role === 'driver').length,
        available: users.filter((user) => user.role === 'driver' && user.isAvailable !== false).length,
        busy: users.filter((user) => user.role === 'driver' && user.isAvailable === false).length,
      },
      vehicles: {
        total: vehicles.length,
        available: vehicles.filter((vehicle) => vehicle.isAvailable !== false).length,
        rented: vehicles.filter((vehicle) => vehicle.isAvailable === false).length,
        pendingKyc: vehicles.filter((vehicle) => vehicle.kyc_status === 'pending').length,
      },
      bookings: {
        total: bookings.length,
        byStatus: countBy(bookings, 'status'),
        revenue: completedBookings.reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0),
      },
      reviews: {
        total: reviews.length,
        averageRating: reviews.length
          ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
          : 0,
      },
    };

    const bookingsWithPayments = await attachPaymentsToBookings(bookings);

    res.json({ stats, users, vehicles, bookings: bookingsWithPayments, reviews });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/admin/review
router.put('/review', protect, adminGuard, async (req, res) => {
  const { id, type, status, reason } = req.body;

  try {
    // Using findByIdAndUpdate bypasses schema blocking completely
    if (type === 'identity') {
      const updateData = { kyc_status: status };
      if (status === 'rejected') updateData['identity_document.extracted_data.rejection_reason'] = reason;
      
      await User.findByIdAndUpdate(id, { $set: updateData });

    } else if (type === 'license') {
      // ✅ FIX 5: Corrected update path for driving license status
      const updateData = { 
        'driving_license.is_verified': status === 'verified',
        'driving_license.status': status 
      };
      if (status === 'rejected') updateData['driving_license.extracted_data.rejection_reason'] = reason;
      
      await User.findByIdAndUpdate(id, { $set: updateData });

    } else if (type === 'vehicle') {
      const updateData = { kyc_status: status };
      if (status === 'rejected') updateData['car_license.extracted_data.rejection_reason'] = reason;
      
      await Vehicle.findByIdAndUpdate(id, { $set: updateData });
    }

    res.json({ message: `Document successfully ${status}` });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
