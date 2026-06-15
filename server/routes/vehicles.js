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

const handleVehicleImageUpload = (req, res, next) => {
  uploadVehicleImages(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        message: err.message || 'Failed to upload vehicle images.',
      });
    }

    next();
  });
};

// @desc    Get all vehicles (Explore Page)
router.get('/', getVehicles);

// @desc    Get single vehicle by ID (Vehicle Details Page)
router.get('/:id', getVehicleById);

// @desc    Create a new vehicle (Add Vehicle Page)
router.post('/', protect, requireVerifiedKyc, handleVehicleImageUpload, createVehicle);

// @desc    Toggle vehicle active/inactive (temporarily disable)
router.put('/:id/toggle-active', protect, toggleVehicleActive);

// @desc    Update vehicle information
router.put('/:id', protect, handleVehicleImageUpload, updateVehicle);

// @desc    Soft-delete a vehicle (remove from fleet, keep booking history)
router.delete('/:id', protect, softDeleteVehicle);

module.exports = router;
