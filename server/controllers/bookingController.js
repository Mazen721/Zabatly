const Booking = require('../models/booking');
const User = require('../models/User');
const Vehicle = require('../models/vehicle');

const sameId = (a, b) => a && b && a.toString() === b.toString();
const blockingStatuses = ['pending', 'confirmed', 'active'];

const parseDateBoundary = (value, endOfDay = false) => {
  if (!value) return null;
  const raw = String(value);
  const date = raw.includes('T')
    ? new Date(raw)
    : new Date(`${raw}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateForMessage = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

const buildOverlapQuery = (vehicle, startDate, endDate) => ({
  vehicle,
  status: { $in: blockingStatuses },
  startDate: { $lte: endDate },
  endDate: { $gte: startDate },
});

const getVehicleReservations = async (vehicle) => Booking.find({
  vehicle,
  status: { $in: blockingStatuses },
  startDate: { $ne: null },
  endDate: { $ne: null },
})
  .select('startDate endDate status')
  .sort({ startDate: 1 });

const findNearestConflict = async (vehicle, startDate, endDate) => Booking.findOne(
  buildOverlapQuery(vehicle, startDate, endDate)
)
  .select('startDate endDate status')
  .sort({ startDate: 1 });

// @desc    Create a Booking (Vehicle OR Driver)
// @route   POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const {
      vehicle,
      driver,
      startDate,
      endDate,
      totalPrice,
      withDriver,
      needsDriver,
      routeDescription,
      paymentMethod,
    } = req.body;

    if (!vehicle && !driver) {
      return res.status(400).json({ message: 'Choose a vehicle or a driver to book.' });
    }

    let bookingOwner = null;
    let bookingDriver = null;

    if (vehicle) {
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Please select booking dates.' });
      }

      const targetVehicle = await Vehicle.findById(vehicle);
      if (!targetVehicle) {
        return res.status(404).json({ message: 'Vehicle not found.' });
      }

      if (sameId(targetVehicle.owner, req.user._id)) {
        return res.status(400).json({ message: "You can't book your own listed car." });
      }

      const requestedStart = parseDateBoundary(startDate);
      const requestedEnd = parseDateBoundary(endDate, true);

      if (!requestedStart || !requestedEnd || requestedStart > requestedEnd) {
        return res.status(400).json({ message: 'Please select a valid date range.' });
      }

      bookingOwner = targetVehicle.owner;

      const existing = await findNearestConflict(vehicle, requestedStart, requestedEnd);
      if (existing) {
        return res.status(409).json({
          message: `This vehicle is already reserved from ${formatDateForMessage(existing.startDate)} to ${formatDateForMessage(existing.endDate)}.`,
          conflict: existing,
        });
      }
    }

    if (!vehicle && driver) {
      if (req.user.role === 'driver') {
        return res.status(400).json({ message: "Drivers can't book other drivers." });
      }

      if (sameId(driver, req.user._id)) {
        return res.status(400).json({ message: "You can't book yourself as a driver." });
      }

      const targetDriver = await User.findOne({ _id: driver, role: 'driver' });
      if (!targetDriver) {
        return res.status(404).json({ message: 'Driver not found.' });
      }

      if (targetDriver.isAvailable === false || targetDriver.currentRide) {
        return res.status(400).json({ message: 'Driver is already on a trip.' });
      }

      bookingDriver = targetDriver._id;
    }

    const booking = new Booking({
      vehicle,
      renter: req.user.id,
      owner: bookingOwner,
      driver: bookingDriver,
      startDate,
      endDate,
      totalPrice,
      paymentMethod: paymentMethod || null,
      paymentStatus: paymentMethod ? 'paid' : 'unpaid',
      paymentProof: req.file ? `/uploads/${req.file.filename}` : '',
      withDriver: withDriver || needsDriver || false,
      routeDescription,
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Booking failed', error: error.message });
  }
};

// @desc    Check vehicle availability for selected dates
// @route   GET /api/bookings/availability
const checkVehicleAvailability = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate } = req.query;

    if (!vehicleId) {
      return res.status(400).json({ message: 'vehicleId is required.' });
    }

    const reservations = await getVehicleReservations(vehicleId);
    const reservedRanges = reservations.map((booking) => ({
      _id: booking._id,
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status,
    }));

    const requestedStart = parseDateBoundary(startDate);
    const requestedEnd = parseDateBoundary(endDate, true);

    if (!requestedStart || !requestedEnd) {
      return res.json({
        available: null,
        reservedRanges,
        conflict: null,
        message: 'Select pickup and return dates to check availability.',
      });
    }

    if (requestedStart > requestedEnd) {
      return res.json({
        available: false,
        reservedRanges,
        conflict: null,
        message: 'Return date must be after pickup date.',
      });
    }

    const conflict = await findNearestConflict(vehicleId, requestedStart, requestedEnd);

    if (conflict) {
      return res.json({
        available: false,
        reservedRanges,
        conflict,
        message: `This vehicle is already reserved from ${formatDateForMessage(conflict.startDate)} to ${formatDateForMessage(conflict.endDate)}.`,
      });
    }

    res.json({
      available: true,
      reservedRanges,
      conflict: null,
      message: 'Vehicle available for selected dates',
    });
  } catch (error) {
    res.status(500).json({ message: 'Availability check failed', error: error.message });
  }
};

// @desc    Get Bookings (Renter, Owner, or Driver)
// @route   GET /api/bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [{ renter: req.user.id }, { owner: req.user.id }, { driver: req.user.id }],
    })
      .populate('vehicle', 'make model images')
      .populate('renter', 'name phone')
      .populate('owner', 'name')
      .populate('driver', 'name')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update Status (Accept, Request Return, Confirm Complete)
// @route   PUT /api/bookings/:id
const updateBookingStatus = async (req, res) => {
  try {
    const { status, renterFinished } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const userId = req.user._id.toString();
    const ownerId = booking.owner ? booking.owner.toString() : null;
    const driverId = booking.driver ? booking.driver.toString() : null;
    const renterId = booking.renter ? booking.renter.toString() : null;

    if (status === 'active') {
      if (booking.vehicle && ownerId !== userId) {
        return res.status(401).json({ message: 'Only the owner can accept this booking.' });
      }
      if (!booking.vehicle && driverId !== userId) {
        return res.status(401).json({ message: 'Only the assigned driver can accept this ride.' });
      }

      booking.status = 'active';
      if (booking.vehicle) {
        await Vehicle.findByIdAndUpdate(booking.vehicle, { isAvailable: false });
      }
      if (booking.driver) {
        await User.findByIdAndUpdate(booking.driver, {
          isAvailable: false,
          currentRide: booking._id,
        });
      }
    } else if (renterFinished === true) {
      if (renterId !== userId) {
        return res.status(401).json({ message: 'Only the renter can request trip completion.' });
      }
      booking.renterFinished = true;
    } else if (status === 'completed') {
      if (booking.vehicle && ownerId !== userId) {
        return res.status(401).json({ message: 'Only the owner can complete this booking.' });
      }
      if (!booking.vehicle && driverId !== userId) {
        return res.status(401).json({ message: 'Only the driver can complete this ride.' });
      }

      booking.status = 'completed';
      booking.driverFinished = true;
      if (booking.vehicle) {
        await Vehicle.findByIdAndUpdate(booking.vehicle, { isAvailable: true });
      }
      if (booking.driver) {
        await User.findByIdAndUpdate(booking.driver, {
          isAvailable: true,
          currentRide: null,
        });
      }
    } else if (status === 'cancelled') {
      const canCancel = [ownerId, driverId, renterId].filter(Boolean).includes(userId);
      if (!canCancel) {
        return res.status(401).json({ message: 'Not authorized to cancel this booking.' });
      }

      booking.status = 'cancelled';
      if (booking.driver) {
        await User.findByIdAndUpdate(booking.driver, {
          isAvailable: true,
          currentRide: null,
        });
      }
    }

    await booking.save();
    await booking.populate([
      { path: 'vehicle', select: 'make model images' },
      { path: 'renter', select: 'name phone' },
      { path: 'owner', select: 'name' },
      { path: 'driver', select: 'name' },
    ]);
    res.json(booking);
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ message: 'Update failed' });
  }
};

// @desc    Finish Ride (Handshake)
// @route   PUT /api/bookings/finish/:id
const finishRide = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const userId = req.user._id ? req.user._id.toString() : req.user.id.toString();
    const driverId = booking.driver ? booking.driver.toString() : null;
    const renterId = booking.renter ? booking.renter.toString() : null;

    if (driverId === userId) {
      booking.driverFinished = true;
    } else if (renterId === userId) {
      booking.renterFinished = true;
    } else {
      return res.status(401).json({ message: 'Not authorized to finish this ride' });
    }

    if (booking.driverFinished && booking.renterFinished) {
      booking.status = 'completed';

      if (booking.driver) {
        await User.findByIdAndUpdate(booking.driver, {
          isAvailable: true,
          currentRide: null,
        });
      }

      if (booking.vehicle) {
        await Vehicle.findByIdAndUpdate(booking.vehicle, { isAvailable: true });
      }
    }

    await booking.save();
    await booking.populate([
      { path: 'vehicle', select: 'make model images' },
      { path: 'renter', select: 'name phone' },
      { path: 'owner', select: 'name' },
      { path: 'driver', select: 'name' },
    ]);
    res.json(booking);
  } catch (error) {
    console.error('Backend Error in finishRide:', error.message);
    res.status(500).json({ message: error.message || 'Finish failed' });
  }
};

module.exports = { createBooking, getMyBookings, updateBookingStatus, finishRide, checkVehicleAvailability };
