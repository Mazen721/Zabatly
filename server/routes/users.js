const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/booking');
const { protect } = require('../middleware/authMiddleware');
const { verifyDocument } = require('../controllers/kycController');
const { updateProfile } = require('../controllers/userController');

const { uploadProfilePhoto, uploadKycDocument } = require('../middleware/uploadMiddleware');

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
      Booking.distinct('driver', { status: 'active', driver: { $ne: null } }),
    ]);
    const activeDriverSet = new Set(activeDriverIds.map((id) => id.toString()));
    res.json(
      drivers.map((driver) => ({
        ...driver,
        isAvailable: activeDriverSet.has(driver._id.toString()) ? false : driver.isAvailable,
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
    const user = await User.findById(req.user._id);
    if (user) {
      if (user.currentRide && req.body.isAvailable === true) {
        return res.status(400).json({ message: 'Finish your active ride before going online.' });
      }
      user.isAvailable = user.currentRide ? false : req.body.isAvailable;
      user.dailyRate = req.body.dailyRate;
      await user.save();
      res.json({ isAvailable: user.isAvailable, dailyRate: user.dailyRate });
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
