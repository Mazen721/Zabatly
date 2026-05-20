const User = require('../models/User');

const requireVerifiedKyc = async (req, res, next) => {
  try {
    // req.user is set by your existing protect/auth middleware
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.kyc_status !== 'verified') {
      return res.status(403).json({ 
        message: 'Please complete identity verification before booking' 
      });
    }

    // If they are verified, let them pass!
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error during KYC check.' });
  }
};

module.exports = { requireVerifiedKyc };