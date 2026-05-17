const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Vehicle = require('../models/vehicle');
const { protect } = require('../middleware/authMiddleware');
const { requireVerifiedKyc } = require('../middleware/kycMiddleware');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// @desc    Get all vehicles (Explore Page)
router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate('owner', 'name email is_verified profilePicture age rating numReviews');
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// ✅ ADDED: Get single vehicle by ID (Vehicle Details Page)
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('owner', 'name email is_verified profilePicture age rating numReviews');
    
    if (vehicle) {
      res.json(vehicle);
    } else {
      res.status(404).json({ message: 'Vehicle not found' });
    }
  } catch (err) {
    console.error("Error fetching single vehicle:", err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Create a new vehicle (Add Vehicle Page)
router.post('/', protect, upload.array('images', 5), async (req, res) => {
  const { 
    make, model, year, type, capacity, price_per_day, 
    fuel, ac, description, transmission, address, has_driver, driver_cost,
    lat, lng, primaryIndex
  } = req.body;

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload at least one vehicle image.' });
    }

    let imagePaths = req.files.map(file => `/uploads/${file.filename}`);

    const primaryIdx = parseInt(primaryIndex) || 0;
    if (primaryIdx > 0 && primaryIdx < imagePaths.length) {
      const [primary] = imagePaths.splice(primaryIdx, 1);
      imagePaths.unshift(primary);
    }

    const parsedAddress = address || 'Alexandria, Egypt';

    const vehicle = new Vehicle({
      owner: req.user._id,
      make,
      model,
      year: Number(year) || new Date().getFullYear(),
      price_per_day: Number(price_per_day),
      type,
      capacity: Number(capacity) || 4,      
      fuel: fuel || 'petrol',          
      ac: ac === 'true' || ac === true,            
      transmission,  
      description: description || "No description provided.",
      
      address: parsedAddress,
      location: {
        lat: Number(lat) || 31.2001,
        lng: Number(lng) || 29.9187,
      },
      
      has_driver: has_driver === 'yes' || has_driver === 'true' || has_driver === true,
      driver_cost: (has_driver === 'yes' || has_driver === 'true' || has_driver === true) ? Number(driver_cost) : 0,
      
      images: imagePaths,
      is_approved: true
    });

    const createdVehicle = await vehicle.save();
    res.status(201).json(createdVehicle);
    
  } catch (err) {
    console.error("Vehicle Validation Error:", err.message);
    res.status(400).json({ 
      message: "Failed to create vehicle", 
      error: err.message 
    });
  }
});

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