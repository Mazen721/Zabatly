const express = require('express');
const router = express.Router();
const { updateDriverProfile, getDrivers } = require('../controllers/driverController');
const { protect } = require('../middleware/authMiddleware');

// Anyone can see drivers
router.get('/', getDrivers);

// Only logged-in users can create a driver profile
router.post('/', protect, updateDriverProfile);

module.exports = router;