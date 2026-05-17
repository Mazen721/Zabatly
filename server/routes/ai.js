const express = require('express');
const router = express.Router();
const { getTripPlan } = require('../controllers/aiController');

// The Chatbot Endpoint
router.post('/', getTripPlan);

module.exports = router;