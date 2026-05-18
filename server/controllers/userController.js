const User = require('../models/User');

const toList = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

// @desc    Update public profile (uses uploadProfilePhoto on the route)
// @route   PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.age = req.body.age || user.age;

    if (req.file) {
      const url = req.file.path;
      user.profilePhoto = url;
      user.profilePicture = url;
    }

    if (req.body.removeProfilePicture === 'true') {
      user.profilePhoto = '';
      user.profilePicture = '';
    }

    if (user.role === 'driver') {
      user.currentLocation = req.body.currentLocation ?? user.currentLocation;
      user.coveredAreas = req.body.coveredAreas != null ? toList(req.body.coveredAreas) : user.coveredAreas;
      user.availability = req.body.availability ?? user.availability;
      user.drivingExperience = req.body.drivingExperience ?? user.drivingExperience;
      user.vehicleTypes = req.body.vehicleTypes != null ? toList(req.body.vehicleTypes) : user.vehicleTypes;
      user.licenseInfo = req.body.licenseInfo ?? user.licenseInfo;
      user.languagesSpoken = req.body.languagesSpoken != null ? toList(req.body.languagesSpoken) : user.languagesSpoken;
      user.contactDetails = req.body.contactDetails ?? user.contactDetails;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      is_verified: updatedUser.is_verified,
      profilePicture: updatedUser.profilePicture,
      profilePhoto: updatedUser.profilePhoto,
      age: updatedUser.age,
      rating: updatedUser.rating,
      numReviews: updatedUser.numReviews,
      kyc_status: updatedUser.kyc_status,
      driving_license: updatedUser.driving_license,
      isAvailable: updatedUser.isAvailable,
      dailyRate: updatedUser.dailyRate,
      currentLocation: updatedUser.currentLocation,
      coveredAreas: updatedUser.coveredAreas,
      availability: updatedUser.availability,
      drivingExperience: updatedUser.drivingExperience,
      vehicleTypes: updatedUser.vehicleTypes,
      licenseInfo: updatedUser.licenseInfo,
      languagesSpoken: updatedUser.languagesSpoken,
      contactDetails: updatedUser.contactDetails,
      token: req.headers.authorization.split(' ')[1],
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

module.exports = { updateProfile };
