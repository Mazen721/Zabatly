const Vehicle = require('../models/vehicle');
const { releaseExpiredBookings } = require('../utils/bookingExpiration');

// @desc    Fetch all vehicles (excludes deleted & inactive from public)
// @route   GET /api/vehicles
const getVehicles = async (req, res) => {
  try {
    await releaseExpiredBookings();
    const keyword = req.query.type ? {
      type: {
        $regex: req.query.type,
        $options: 'i',
      },
    } : {};

    // Include owner-only flag to bypass active/deleted filters
    const ownerView = req.query.ownerView === 'true';
    const filter = { ...keyword };
    if (!ownerView) {
      filter.isDeleted = { $ne: true };
      filter.isActive = { $ne: false };
    }

    const vehicles = await Vehicle.find(filter)
      .populate('owner', 'name email is_verified profilePicture profilePhoto age rating numReviews');

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
    await releaseExpiredBookings();
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('owner', 'name email is_verified profilePicture profilePhoto age rating numReviews');

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

// @desc    Create a vehicle (route applies uploadVehicleImages)
// @route   POST /api/vehicles
const createVehicle = async (req, res) => {
  const {
    make, model, year, type, capacity, price_per_day,
    fuel, ac, description, transmission, address, governorate, city,
    has_driver, driver_cost, lat, lng, primaryIndex,
  } = req.body;

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload at least one vehicle image.' });
    }

    let imagePaths = req.files.map((f) => f.path);

    const primaryIdx = parseInt(primaryIndex, 10) || 0;
    if (primaryIdx > 0 && primaryIdx < imagePaths.length) {
      const [primary] = imagePaths.splice(primaryIdx, 1);
      imagePaths.unshift(primary);
    }

    const parsedAddress = String(address || '').trim() || 'Location not set';

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
      description: description || 'No description provided.',

      governorate: governorate || '',
      city: city || '',
      address: parsedAddress,
      location: {
        lat: Number(lat) || 26.8206,
        lng: Number(lng) || 30.8025,
      },

      has_driver: has_driver === 'yes' || has_driver === 'true' || has_driver === true,
      driver_cost: (has_driver === 'yes' || has_driver === 'true' || has_driver === true) ? Number(driver_cost) : 0,

      images: imagePaths,
      is_approved: true,
    });

    const createdVehicle = await vehicle.save();
    res.status(201).json(createdVehicle);
  } catch (err) {
    console.error('Vehicle Validation Error:', err.message);
    res.status(400).json({
      message: 'Failed to create vehicle',
      error: err.message,
    });
  }
};

// @desc    Soft-delete a vehicle (keep booking history)
// @route   DELETE /api/vehicles/:id
const softDeleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    vehicle.isDeleted = true;
    vehicle.isActive = false;
    await vehicle.save();
    res.json({ message: 'Vehicle removed from fleet' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Toggle vehicle active status (enable/disable)
// @route   PUT /api/vehicles/:id/toggle-active
const toggleVehicleActive = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    vehicle.isActive = !vehicle.isActive;
    await vehicle.save();
    res.json({ message: vehicle.isActive ? 'Vehicle activated' : 'Vehicle deactivated', isActive: vehicle.isActive });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update vehicle information
// @route   PUT /api/vehicles/:id
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const allowedFields = [
      'make', 'model', 'year', 'type', 'capacity', 'price_per_day',
      'transmission', 'fuel', 'ac', 'description', 'address',
      'governorate', 'city', 'has_driver', 'driver_cost',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'ac') {
          vehicle[field] = req.body[field] === 'true' || req.body[field] === true;
        } else if (field === 'has_driver') {
          vehicle[field] = req.body[field] === 'yes' || req.body[field] === 'true' || req.body[field] === true;
        } else if (['year', 'capacity', 'price_per_day', 'driver_cost'].includes(field)) {
          vehicle[field] = Number(req.body[field]);
        } else {
          vehicle[field] = req.body[field];
        }
      }
    });

    if (req.body.lat && req.body.lng) {
      vehicle.location = { lat: Number(req.body.lat), lng: Number(req.body.lng) };
    }

    // If new images were uploaded, merge or replace
    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map((f) => f.path);
      vehicle.images = [...vehicle.images, ...newImagePaths].slice(0, 10);
    }

    const updatedVehicle = await vehicle.save();
    const populated = await Vehicle.findById(updatedVehicle._id)
      .populate('owner', 'name email is_verified profilePicture profilePhoto age rating numReviews');
    res.json(populated);
  } catch (err) {
    console.error('Vehicle Update Error:', err.message);
    res.status(400).json({ message: 'Failed to update vehicle', error: err.message });
  }
};

module.exports = { getVehicles, getVehicleById, createVehicle, softDeleteVehicle, toggleVehicleActive, updateVehicle };
