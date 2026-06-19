const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Vehicle = require('../models/vehicle');
const Booking = require('../models/booking');
const Review = require('../models/Review');
const KycAuditLog = require('../models/KycAuditLog');
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
    const identityPending = await User.find({
      kyc_status: 'pending',
      'identity_document.doc_type': { $in: ['national_id', 'passport'] },
    }).select('name email identity_document').lean();
    const identityManual = await User.find({
      kyc_status: 'manual_review',
      'identity_document.doc_type': { $in: ['national_id', 'passport'] },
    }).select('name email identity_document').lean();
    const identity = [
      ...identityManual.map(item => ({ ...item, review_priority: 'high' })),
      ...identityPending.map(item => ({ ...item, review_priority: 'medium' }))
    ];
    
    const licensesPending = await User.find({ 'driving_license.status': 'pending' }).select('name email driving_license').lean();
    const licensesManual = await User.find({ 'driving_license.status': 'manual_review' }).select('name email driving_license').lean();
    const licenses = [
      ...licensesManual.map(item => ({ ...item, review_priority: 'high' })),
      ...licensesPending.map(item => ({ ...item, review_priority: 'medium' }))
    ];
    
    const vehiclesPending = await Vehicle.find({ kyc_status: 'pending' }).populate('owner', 'name email').select('make model year car_license owner').lean();
    const vehiclesManual = await Vehicle.find({ kyc_status: 'manual_review' }).populate('owner', 'name email').select('make model year car_license owner').lean();
    const vehicles = [
      ...vehiclesManual.map(item => ({ ...item, review_priority: 'high' })),
      ...vehiclesPending.map(item => ({ ...item, review_priority: 'medium' }))
    ];
    
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
        .populate('owner', 'name email role payoutInfo')
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

    // Non-admin users for role-specific stats
    const nonAdminUsers = users.filter((user) => user.role !== 'admin');
    // Revenue: count all bookings that were actually paid
    const paidBookings = bookings.filter((b) => b.paymentStatus === 'paid');
    // Only count active (non-deleted) vehicles
    const activeVehicles = vehicles.filter((v) => !v.isDeleted);
    const stats = {
      users: {
        total: users.length,
        byRole: countBy(users, 'role'),
        verified: nonAdminUsers.filter((user) => user.kyc_status === 'verified').length,
        pendingKyc: nonAdminUsers.filter((user) => user.kyc_status === 'pending' || user.kyc_status === 'manual_review').length,
      },
      drivers: {
        total: nonAdminUsers.filter((user) => user.role === 'driver').length,
        available: nonAdminUsers.filter((user) => user.role === 'driver' && user.isAvailable !== false && user.driverStatus !== 'offline').length,
        busy: nonAdminUsers.filter((user) => user.role === 'driver' && (user.isAvailable === false || user.driverStatus === 'busy')).length,
      },
      vehicles: {
        total: activeVehicles.length,
        available: activeVehicles.filter((vehicle) => vehicle.isAvailable === true).length,
        rented: activeVehicles.filter((vehicle) => vehicle.isAvailable === false).length,
        pendingKyc: activeVehicles.filter((vehicle) => vehicle.kyc_status === 'pending' || vehicle.kyc_status === 'manual_review').length,
      },
      bookings: {
        total: bookings.length,
        byStatus: countBy(bookings, 'status'),
        revenue: paidBookings.reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0),
        netProfit: paidBookings.reduce((sum, booking) => sum + Number(booking.serviceFee || 0), 0),
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
      // Corrected update path for driving license status
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

// @route   GET /api/admin/kyc-logs
// @desc    Get paginated KYC audit logs with filters
router.get('/kyc-logs', protect, adminGuard, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      userId,
      result,
      provider,
      doc_type,
      risk_level,
      minConfidence,
      maxConfidence,
      startDate,
      endDate,
    } = req.query;
    const query = {};

    if (userId) {
      query.userId = userId;
    }
    if (result) {
      query.result = result;
    }
    if (provider) {
      query.provider = provider;
    }
    if (doc_type) {
      query.doc_type = doc_type;
    }
    if (risk_level) {
      query.risk_level = risk_level;
    }
    if (minConfidence || maxConfidence) {
      query.confidence_score = {};
      if (minConfidence) {
        const min = Number(minConfidence);
        if (!Number.isNaN(min)) query.confidence_score.$gte = min;
      }
      if (maxConfidence) {
        const max = Number(maxConfidence);
        if (!Number.isNaN(max)) query.confidence_score.$lte = max;
      }
      if (Object.keys(query.confidence_score).length === 0) delete query.confidence_score;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await KycAuditLog.countDocuments(query);
    const logs = await KycAuditLog.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      logs,
    });
  } catch (error) {
    console.error('Error fetching KYC logs:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
