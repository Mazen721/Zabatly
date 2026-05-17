const DriverProfile = require('../models/DriverProfile');
const User = require('../models/User');

// @desc    Create or Update Driver Profile
// @route   POST /api/drivers
const updateDriverProfile = async (req, res) => {
  const { license_type, years_experience, hourly_rate, city, license_document } = req.body;

  try {
    // 1. Check if profile already exists for this user
    let profile = await DriverProfile.findOne({ user: req.user.id });

    if (profile) {
      // Update existing
      profile.license_type = license_type;
      profile.years_experience = years_experience;
      profile.hourly_rate = hourly_rate;
      profile.city = city;
      profile.license_document = license_document; // URL from OCR or upload
      await profile.save();
      return res.json(profile);
    }

    // 2. Create new
    profile = new DriverProfile({
      user: req.user.id,
      license_type,
      years_experience,
      hourly_rate,
      city,
      license_document
    });

    await profile.save();
    
    // Update User role to 'driver' automatically
    await User.findByIdAndUpdate(req.user.id, { role: 'driver' });

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all drivers (with optional city filter)
// @route   GET /api/drivers
const getDrivers = async (req, res) => {
  try {
    const { city } = req.query;
    const filter = city ? { city: { $regex: city, $options: 'i' } } : {};

    // Get profiles and populate the 'user' field (to get name & photo)
    const drivers = await DriverProfile.find(filter).populate('user', 'name profile_image phone');
    
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { updateDriverProfile, getDrivers };