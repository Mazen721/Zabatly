const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireVerifiedKyc } = require('../middleware/kycMiddleware');
const { uploadVehicleImages } = require('../middleware/uploadMiddleware');
const {
  createVehicle,
  getVehicles,
  getVehicleById,
  softDeleteVehicle,
  toggleVehicleActive,
  updateVehicle,
} = require('../controllers/vehicleController');

// @desc    Get all vehicles (Explore Page)
router.get('/', getVehicles);

// @desc    Get single vehicle by ID (Vehicle Details Page)
router.get('/:id', getVehicleById);

// @desc    Create a new vehicle (Add Vehicle Page)
router.post('/', protect, requireVerifiedKyc, uploadVehicleImages, createVehicle);

// @desc    Toggle vehicle active/inactive (temporarily disable)
router.put('/:id/toggle-active', protect, toggleVehicleActive);

// @desc    Update vehicle information
router.put('/:id', protect, uploadVehicleImages, updateVehicle);

// @desc    Soft-delete a vehicle (remove from fleet, keep booking history)
router.delete('/:id', protect, softDeleteVehicle);

module.exports = router;