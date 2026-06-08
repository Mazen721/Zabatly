const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Booking = require('../models/booking');
const { protect } = require('../middleware/authMiddleware');
const { verifyDocument } = require('../controllers/kycController');
const { updateProfile } = require('../controllers/userController');

const { uploadProfilePhoto, uploadKycDocument } = require('../middleware/uploadMiddleware');
const { releaseExpiredBookings, blockingStatuses } = require('../utils/bookingExpiration');

const getOptionalViewer = async (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;

  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    return decoded?.id || null;
  } catch {
    return null;
  }
};

// ==========================================
// ✅ THE "FRESH DATA" ROUTE 
// (This tells React if the Admin approved the ID)
// ==========================================
// @desc    Get current user profile (Fresh data from DB)
// @route   GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  try {
    // ✅ NEW: Added .lean() to bypass Schema rules and force raw data transfer!
    const user = await User.findById(req.user._id).select('-password').lean();
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get all freelance drivers
// @route   GET /api/users/drivers
router.get('/drivers', async (req, res) => {
  try {
    await releaseExpiredBookings();
    const { location = '', area = '', availability = '', search = '' } = req.query;
    const query = { role: 'driver' };

    if (availability) {
      query.availability = { $regex: availability, $options: 'i' };
    }

    const locationTerms = [location, area].filter(Boolean);
    if (locationTerms.length > 0) {
      query.$and = locationTerms.map((term) => ({
        $or: [
          { currentLocation: { $regex: term, $options: 'i' } },
          { coveredAreas: { $elemMatch: { $regex: term, $options: 'i' } } },
        ],
      }));
    }

    if (search) {
      const searchClause = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { currentLocation: { $regex: search, $options: 'i' } },
          { coveredAreas: { $elemMatch: { $regex: search, $options: 'i' } } },
          { vehicleTypes: { $elemMatch: { $regex: search, $options: 'i' } } },
          { languagesSpoken: { $elemMatch: { $regex: search, $options: 'i' } } },
        ],
      };
      query.$and = query.$and ? [...query.$and, searchClause] : [searchClause];
    }

    const [drivers, activeDriverIds] = await Promise.all([
      User.find(query).select('-password').sort({ isAvailable: -1, rating: -1 }).lean(),
      Booking.distinct('driver', {
        status: { $in: blockingStatuses },
        driver: { $ne: null },
        endDate: { $gt: new Date() },
      }),
    ]);
    const activeDriverSet = new Set(activeDriverIds.map((id) => id.toString()));
    res.json(
      drivers.map((driver) => ({
        ...driver,
        driverStatus: activeDriverSet.has(driver._id.toString())
          ? 'busy'
          : driver.driverStatus || (driver.isAvailable === false ? 'offline' : 'online'),
        isAvailable: activeDriverSet.has(driver._id.toString())
          ? false
          : (driver.driverStatus || (driver.isAvailable === false ? 'offline' : 'online')) === 'online',
      }))
    );
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Update Driver Settings (Availability & Rate)
// @route   PUT /api/users/driver-settings
router.put('/driver-settings', protect, async (req, res) => {
  try {
    await releaseExpiredBookings();
    const user = await User.findById(req.user._id);
    if (user) {
      const requestedStatus = req.body.driverStatus || (req.body.isAvailable ? 'online' : 'offline');
      if (!['online', 'busy', 'offline'].includes(requestedStatus)) {
        return res.status(400).json({ message: 'Invalid driver status.' });
      }

      const activeReservation = await Booking.exists({
        driver: user._id,
        status: { $in: blockingStatuses },
        endDate: { $gt: new Date() },
      });
      if ((user.currentRide || activeReservation) && requestedStatus === 'online') {
        return res.status(400).json({ message: 'Finish your active reservation before going online.' });
      }

      user.driverStatus = user.currentRide || activeReservation ? 'busy' : requestedStatus;
      user.isAvailable = user.driverStatus === 'online';
      user.dailyRate = req.body.dailyRate;
      await user.save();
      res.json({ isAvailable: user.isAvailable, driverStatus: user.driverStatus, dailyRate: user.dailyRate });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update Public Profile (Picture & Age)
// @route   PUT /api/users/profile
router.put('/profile', protect, uploadProfilePhoto, updateProfile);

// @desc    Get saved vehicles for current renter
// @route   GET /api/users/saved-vehicles
router.get('/saved-vehicles', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'savedVehicles',
        select: 'make model year images price_per_day type isAvailable transmission capacity has_driver city governorate address location rating numReviews owner',
        populate: { path: 'owner', select: 'name profilePicture is_verified' },
      })
      .lean();
    res.json(user?.savedVehicles || []);
  } catch (error) {
    res.status(500).json({ message: 'Could not load saved vehicles' });
  }
});

// @desc    Toggle a saved vehicle
// @route   PUT /api/users/saved-vehicles/:vehicleId
router.put('/saved-vehicles/:vehicleId', protect, async (req, res) => {
  try {
    const Vehicle = require('../models/vehicle');
    const vehicleExists = await Vehicle.exists({ _id: req.params.vehicleId });
    if (!vehicleExists) return res.status(404).json({ message: 'Vehicle not found' });

    const user = await User.findById(req.user._id);
    const vehicleId = req.params.vehicleId.toString();
    const saved = (user.savedVehicles || []).map((id) => id.toString());
    const isSaved = saved.includes(vehicleId);

    user.savedVehicles = isSaved
      ? user.savedVehicles.filter((id) => id.toString() !== vehicleId)
      : [...(user.savedVehicles || []), req.params.vehicleId];
    await user.save();

    res.json({
      saved: !isSaved,
      savedVehicleIds: user.savedVehicles.map((id) => id.toString()),
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not update saved vehicle' });
  }
});

// @desc    Get public profile for any user by ID
// @route   GET /api/users/:id/public
router.get('/:id/public', async (req, res) => {
  try {
    const Vehicle = require('../models/vehicle');
    const viewerId = await getOptionalViewer(req);
    const user = await User.findById(req.params.id)
      .select('name profilePicture role rating numReviews createdAt kyc_status city currentLocation dateOfBirth phone emergencyContact')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get vehicles listed by this user
    const vehicles = await Vehicle.find({ owner: req.params.id })
      .select('make model year images price_per_day type isAvailable rating numReviews')
      .lean();

    const bookingRoleQuery = user.role === 'agency'
      ? { owner: req.params.id }
      : { renter: req.params.id };
    const countedStatuses = user.role === 'agency'
      ? ['completed', 'active', 'confirmed']
      : ['completed', 'expired'];
    const totalBookings = await Booking.countDocuments({
      ...bookingRoleQuery,
      status: { $in: countedStatuses },
    });

    const canViewSensitive = viewerId && (
      viewerId.toString() === req.params.id.toString()
      || await Booking.exists({
        $and: [
          { $or: [{ renter: req.params.id }, { owner: req.params.id }, { driver: req.params.id }] },
          { $or: [{ renter: viewerId }, { owner: viewerId }, { driver: viewerId }] },
        ],
      })
    );

    const sensitiveFields = canViewSensitive
      ? {
          dateOfBirth: user.dateOfBirth,
          phone: user.phone,
          emergencyContact: user.emergencyContact,
        }
      : {};
    const publicUser = { ...user };
    delete publicUser.dateOfBirth;
    delete publicUser.phone;
    delete publicUser.emergencyContact;

    res.json({
      ...publicUser,
      ...sensitiveFields,
      is_verified: user.kyc_status === 'verified',
      vehicles,
      totalRentals: totalBookings,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Upgrade user account to vehicle host (agency)
// @route   POST /api/users/upgrade-to-host
router.post('/upgrade-to-host', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role !== 'user') {
      return res.status(400).json({ message: 'Only renters can upgrade to vehicle host.' });
    }

    user.role = 'agency';
    const updated = await user.save();

    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      is_verified: updated.is_verified,
      profilePicture: updated.profilePicture,
      profilePhoto: updated.profilePhoto,
      age: updated.age,
      dateOfBirth: updated.dateOfBirth,
      gender: updated.gender,
      phone: updated.phone,
      city: updated.city,
      nationality: updated.nationality,
      preferredLanguage: updated.preferredLanguage,
      emergencyContact: updated.emergencyContact,
      rating: updated.rating,
      numReviews: updated.numReviews,
      kyc_status: updated.kyc_status,
      driving_license: updated.driving_license,
      token: req.headers.authorization.split(' ')[1],
    });
  } catch (error) {
    console.error('Upgrade to host error:', error);
    res.status(500).json({ message: 'Failed to upgrade account.' });
  }
});

// @desc    Upload document, send to Python AI, update KYC
// @route   POST /api/users/kyc/verify
router.post('/kyc/verify', protect, uploadKycDocument, verifyDocument);

// @desc    Delete User Account
// @route   DELETE /api/users/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
       return res.status(401).json({ message: "Not authorized to delete this account" });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
