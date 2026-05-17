const Vehicle = require('../models/vehicle');

// @desc    Fetch all vehicles
// @route   GET /api/vehicles
const getVehicles = async (req, res) => {
  try {
    const keyword = req.query.type ? {
      type: {
        $regex: req.query.type,
        $options: 'i',
      },
    } : {};

    // .populate() replaces the owner ID with the actual User object
    // ✅ MODIFIED: Now fetches profile picture, age, rating, and review count!
    const vehicles = await Vehicle.find({ ...keyword })
      .populate('owner', 'name email is_verified profilePicture age rating numReviews');

    res.json(vehicles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch single vehicle
// @route   GET /api/vehicles/:id
const getVehicleById = async (req, res) => {
  try {
    // ✅ MODIFIED: Now fetches the owner's trust & safety profile data!
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('owner', 'name email is_verified profilePicture age rating numReviews');

    if (vehicle) {
      res.json(vehicle);
    } else {
      res.status(404).json({ message: 'Vehicle not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a vehicle
// @route   POST /api/vehicles
const createVehicle = async (req, res) => {
  try {
    // 1. Destructure ALL the fields we added in the frontend, including lat/lng
    const { 
      owner, make, model, year, price_per_day, type, capacity, 
      has_driver, driver_cost, address, fuel, ac, description, transmission, lat, lng
    } = req.body;

    // 2. CRITICAL FIX: Assign the owner automatically using the logged-in user's token!
    // (If req.user exists from your auth middleware, use it. Otherwise fallback to body)
    const vehicleOwner = (req.user && req.user._id) ? req.user._id : owner;

    if (!vehicleOwner) {
       return res.status(400).json({ message: "Error: Could not determine the vehicle owner." });
    }

    // 3. Handle images gracefully (Supports both upload.single and upload.array)
    let imagesToSave = [];
    if (req.files && req.files.length > 0) {
        imagesToSave = req.files.map(file => `/uploads/${file.filename}`);
    } else if (req.file) {
        imagesToSave = [`/uploads/${req.file.filename}`];
    } else {
        return res.status(400).json({ message: "Please upload at least one vehicle image" });
    }

    // 4. Build the complete Vehicle object
    const vehicle = new Vehicle({
      owner: vehicleOwner,
      make, 
      model, 
      type,
      transmission, // ✅ Fixed: Now saves transmission
      description: description || "No description provided.",
      year: Number(year) || 2026, 
      price_per_day: Number(price_per_day), 
      capacity: Number(capacity),          
      has_driver: has_driver === 'true',    
      driver_cost: Number(driver_cost) || 0, // ✅ Fixed: Now saves extra driver cost
      
      // ✅ Fixed: Now saves exact map coordinates!
      lat: Number(lat) || 31.2001, 
      lng: Number(lng) || 29.9187,
      address: address || "Alexandria, Egypt",

      // Fallback for nested specs
      location: {
        address: address || "Alexandria, Egypt"
      },
      specs: {
        fuel: fuel || "petrol",
        ac: ac === 'true' || ac === true 
      },
      
      images: imagesToSave,
      is_approved: true // Automatically approved so you can see it immediately
    });

    // 5. Save to MongoDB
    const savedVehicle = await vehicle.save();
    res.status(201).json(savedVehicle);

  } catch (error) {
    console.error("Vehicle Creation Error:", error);
    res.status(400).json({ 
      message: 'Invalid vehicle data', 
      error: error.message 
    });
  }
};

module.exports = { getVehicles, getVehicleById, createVehicle };