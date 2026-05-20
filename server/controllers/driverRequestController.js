const DriverRequest = require('../models/DriverRequest');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

const sameId = (a, b) => a && b && a.toString() === b.toString();

const populateFields = [
  { path: 'riderId', select: 'name phone' },
  { path: 'driverId', select: 'name phone' },
];

// @desc    Renter creates a request to a specific driver
// @route   POST /api/driver-requests
const createDriverRequest = async (req, res) => {
  try {
    const { driverId, pickup, dropoff, scheduledAt, price, notes } = req.body;

    if (!driverId || !pickup || !dropoff || !scheduledAt || price === undefined || price === '') {
      return res.status(400).json({
        message: 'driverId, pickup, dropoff, scheduledAt, and price are required.',
      });
    }

    if (sameId(driverId, req.user._id)) {
      return res.status(400).json({ message: "You can't request yourself as a driver." });
    }

    const driver = await User.findOne({ _id: driverId, role: 'driver' });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found.' });
    }

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ message: 'Invalid scheduledAt date.' });
    }

    const request = await DriverRequest.create({
      riderId: req.user._id,
      driverId,
      pickup,
      dropoff,
      scheduledAt: scheduledDate,
      price: Number(price),
      notes: notes || '',
    });

    await request.populate(populateFields);
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Could not create driver request', error: error.message });
  }
};

// @desc    Get requests for logged-in user (rider or driver)
// @route   GET /api/driver-requests/my
const getMyRequests = async (req, res) => {
  try {
    let filter;

    if (req.user.role === 'user') {
      filter = { riderId: req.user._id };
    } else if (req.user.role === 'driver') {
      filter = { driverId: req.user._id };
    } else {
      return res.status(403).json({ message: 'Not authorized to view driver requests.' });
    }

    const requests = await DriverRequest.find(filter)
      .populate(populateFields)
      .sort({ createdAt: -1 })
      .lean();

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Driver accepts or rejects a request
// @route   PATCH /api/driver-requests/:id/status
const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be accepted or rejected.' });
    }

    const request = await DriverRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Driver request not found.' });
    }

    if (!sameId(request.driverId, req.user._id)) {
      return res.status(403).json({ message: 'Only the assigned driver can update this request.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be accepted or rejected.' });
    }

    if (status === 'accepted') {
      const acceptingDriver = await User.findById(req.user._id).select('driving_license');
      if (!acceptingDriver?.driving_license?.is_verified) {
        return res.status(400).json({ message: 'You must have a verified driving license to accept this request.' });
      }
    }

    request.status = status;
    await request.save();
    await request.populate(populateFields);

    if (status === 'accepted') {
      await createNotification(
        request.riderId,
        'Your driver request has been accepted.',
        'driver_request'
      );
    } else {
      await createNotification(
        request.riderId,
        'Your driver request has been rejected.',
        'driver_request'
      );
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

// @desc    Renter cancels a pending request
// @route   PATCH /api/driver-requests/:id/cancel
const cancelRequest = async (req, res) => {
  try {
    const request = await DriverRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Driver request not found.' });
    }

    if (!sameId(request.riderId, req.user._id)) {
      return res.status(403).json({ message: 'Only the rider can cancel this request.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled.' });
    }

    request.status = 'cancelled';
    await request.save();
    await request.populate(populateFields);
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Cancel failed', error: error.message });
  }
};

// @desc    Driver marks request as completed
// @route   PATCH /api/driver-requests/:id/complete
const completeRequest = async (req, res) => {
  try {
    const request = await DriverRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Driver request not found.' });
    }

    if (!sameId(request.driverId, req.user._id)) {
      return res.status(403).json({ message: 'Only the assigned driver can complete this request.' });
    }

    if (request.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted requests can be completed.' });
    }

    request.status = 'completed';
    await request.save();
    await request.populate(populateFields);

    await createNotification(
      request.riderId,
      'Your driver request has been completed.',
      'driver_request'
    );

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Complete failed', error: error.message });
  }
};

module.exports = {
  createDriverRequest,
  getMyRequests,
  updateRequestStatus,
  cancelRequest,
  completeRequest,
};
