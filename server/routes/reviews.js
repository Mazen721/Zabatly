const express = require('express');
const router = express.Router();
const { createReview, getVehicleReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createReview);
router.get('/vehicle/:vehicleId', getVehicleReviews);

module.exports = router;