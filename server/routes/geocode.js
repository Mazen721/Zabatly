const express = require('express');
const router = express.Router();
const { reverseGeocode } = require('../controllers/geocodeController');

router.get('/reverse', reverseGeocode);

module.exports = router;
