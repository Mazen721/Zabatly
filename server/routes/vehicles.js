const express = require('express');
const router = express.Router();
const Vehicle = require('../models/vehicle');
const { protect } = require('../middleware/authMiddleware');
const { uploadVehicleImages } = require('../middleware/uploadMiddleware');
const { createVehicle, getVehicles, getVehicleById } = require('../controllers/vehicleController');

// @desc    Get all vehicles (Explore Page)
router.get('/', getVehicles);

// ✅ ADDED: Get single vehicle by ID (Vehicle Details Page)
router.get('/:id', getVehicleById);

// @desc    Create a new vehicle (Add Vehicle Page)
router.post('/', protect, uploadVehicleImages, createVehicle);

// @desc    Delete a vehicle
router.delete('/:id', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    
    if (vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this vehicle' });
    }
    
    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vehicle removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;