const Booking = require('../models/booking');
const User = require('../models/User');
const Vehicle = require('../models/vehicle');
const { createPaymentForBooking, attachPaymentsToBookings } = require('./paymentController');
const { createNotification } = require('../utils/notificationHelper');
const { releaseExpiredBookings, scheduleNextBookingExpiry, blockingStatuses } = require('../utils/bookingExpiration');

const sameId = (a, b) => a && b && a.toString() === b.toString();
const VALID_PAYMENT_METHODS = new Set(['vodafone_cash', 'instapay', 'card']);

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
    ? new Date(value).toLocaleString('en-GB', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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

const buildDriverOverlapQuery = (driver, startDate, endDate) => ({
  driver,
  status: { $in: blockingStatuses },
  startDate: { $lte: endDate },
  endDate: { $gte: startDate },
});

const findNearestDriverConflict = async (driver, startDate, endDate) => Booking.findOne(
  buildDriverOverlapQuery(driver, startDate, endDate)
)
  .select('startDate endDate status')
  .sort({ startDate: 1 });

// @desc    Create a Booking (Vehicle OR Driver)
// @route   POST /api/bookings
const createBooking = async (req, res) => {
  try {
    await releaseExpiredBookings();
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
      rentalPrice,
      serviceFee,
    } = req.body;

    if (!vehicle && !driver) {
      return res.status(400).json({ message: 'Choose a vehicle or a driver to book.' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ message: 'paymentMethod is required.' });
    }
    if (!VALID_PAYMENT_METHODS.has(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method.' });
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
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Please select reservation start and end times.' });
      }

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

      const targetDriverStatus = targetDriver.driverStatus || (targetDriver.isAvailable === false ? 'offline' : 'online');
      if (targetDriverStatus !== 'online' || targetDriver.currentRide) {
        return res.status(400).json({ message: 'Driver is already on a trip.' });
      }

      const requestedStart = parseDateBoundary(startDate);
      const requestedEnd = parseDateBoundary(endDate);

      if (!requestedStart || !requestedEnd || requestedStart >= requestedEnd) {
        return res.status(400).json({ message: 'Please select a valid reservation time range.' });
      }

      const existing = await findNearestDriverConflict(driver, requestedStart, requestedEnd);
      if (existing) {
        return res.status(409).json({
          message: `This driver is already reserved from ${formatDateForMessage(existing.startDate)} to ${formatDateForMessage(existing.endDate)}.`,
          conflict: existing,
        });
      }

      bookingDriver = targetDriver._id;
    }

    const proofUrl = req.file ? req.file.path : '';
    const vehicleRentalPrice = Number(rentalPrice ?? totalPrice) || 0;
    const zabatlyServiceFee = Number(serviceFee) || 0;
    const finalTotalPrice = Number(totalPrice) || vehicleRentalPrice + zabatlyServiceFee;
    const paymentConfirmed = paymentMethod === 'card';

    const booking = new Booking({
      vehicle,
      renter: req.user.id,
      owner: bookingOwner,
      driver: bookingDriver,
      startDate: vehicle ? parseDateBoundary(startDate) : parseDateBoundary(startDate),
      endDate: vehicle ? parseDateBoundary(endDate, true) : parseDateBoundary(endDate),
      rentalPrice: vehicleRentalPrice,
      serviceFee: zabatlyServiceFee,
      totalPrice: finalTotalPrice,
      paymentStatus: paymentConfirmed ? 'paid' : 'unpaid',
      payoutAmount: bookingOwner ? vehicleRentalPrice : 0,
      // A direct driver booking always waits for the driver to accept it,
      // even when card payment has already been confirmed.
      status: bookingDriver ? 'pending' : (paymentConfirmed ? 'confirmed' : 'pending'),
      withDriver: withDriver || needsDriver || false,
      routeDescription,
    });

    await booking.save();
    scheduleNextBookingExpiry().catch((error) => console.error('Booking expiry schedule failed:', error.message));

    if (bookingOwner) {
      await createNotification(
        bookingOwner,
        paymentConfirmed
          ? 'You have a new confirmed booking for your vehicle.'
          : 'You have a new booking request for your vehicle.',
        paymentConfirmed ? 'booking_confirmed' : 'new_booking_request'
      );
    } else if (bookingDriver) {
      await createNotification(
        bookingDriver,
        'You have a new driver booking request.',
        'driver_request'
      );
    }

    await createPaymentForBooking({
      bookingId: booking._id,
      userId: req.user._id,
      amount: finalTotalPrice,
      method: paymentMethod,
      proofUrl,
      status: paymentConfirmed ? 'confirmed' : 'pending',
    });

    await booking.populate([
      { path: 'renter', select: 'name phone' },
      { path: 'driver', select: 'name phone' },
    ]);
    const [bookingWithPayment] = await attachPaymentsToBookings([booking.toObject()]);
    res.status(201).json(bookingWithPayment);
  } catch (error) {
    res.status(500).json({ message: 'Booking failed', error: error.message });
  }
};

// @desc    Check vehicle availability for selected dates
// @route   GET /api/bookings/availability
const checkVehicleAvailability = async (req, res) => {
  try {
    await releaseExpiredBookings();
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
    await releaseExpiredBookings();
    const bookings = await Booking.find({
      $or: [{ renter: req.user.id }, { owner: req.user.id }, { driver: req.user.id }],
    })
      .populate('vehicle', 'make model images')
      .populate('renter', 'name phone profilePicture')
      .populate('owner', 'name')
      .populate('driver', 'name phone')
      .sort({ createdAt: -1 })
      .lean();

    res.json(await attachPaymentsToBookings(bookings));
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
        return res.status(401).json({ message: 'Only the owner can start this rental.' });
      }
      if (!booking.vehicle && driverId !== userId) {
        return res.status(401).json({ message: 'Only the assigned driver can start this ride.' });
      }

      if (booking.status !== 'confirmed') {
        return res.status(400).json({ message: 'Only confirmed bookings can be started.' });
      }
      if (booking.paymentStatus !== 'paid') {
        return res.status(400).json({ message: 'The booking must be paid before the rental starts.' });
      }

      const now = new Date();
      if (!booking.startDate || !booking.endDate || now < booking.startDate || now >= booking.endDate) {
        return res.status(400).json({ message: 'This rental can only be started during its booked time.' });
      }

      // Feature 4: Verify driver has a verified driving license.
      if ((booking.withDriver && booking.vehicle) || (!booking.vehicle && booking.driver)) {
        const acceptingDriver = await User.findById(req.user._id);
        if (!acceptingDriver || !acceptingDriver.driving_license || acceptingDriver.driving_license.is_verified !== true) {
          return res.status(400).json({ message: 'You must have a verified driving license to accept this trip.' });
        }
      }

      booking.status = 'active';
      if (booking.vehicle) {
        await Vehicle.findByIdAndUpdate(booking.vehicle, { isAvailable: false });
      }
      if (booking.driver) {
        await User.findByIdAndUpdate(booking.driver, {
          isAvailable: false,
          driverStatus: 'busy',
          currentRide: booking._id,
        });
      }

      await createNotification(
        booking.renter,
        'Your rental has started.',
        'booking_confirmed'
      );
    } else if (status === 'confirmed') {
      if (booking.vehicle && ownerId !== userId) {
        return res.status(401).json({ message: 'Only the owner can accept this booking.' });
      }
      if (!booking.vehicle && driverId !== userId) {
        return res.status(401).json({ message: 'Only the assigned driver can accept this ride.' });
      }
      const isLegacyUnacceptedDriverRequest = !booking.vehicle
        && booking.driver
        && booking.status === 'confirmed'
        && !booking.driverAcceptedAt;
      if (booking.status !== 'pending' && !isLegacyUnacceptedDriverRequest) {
        return res.status(400).json({ message: 'Only pending bookings can be accepted.' });
      }

      if (!booking.vehicle && booking.driver) {
        const acceptingDriver = await User.findById(req.user._id).select('driving_license');
        if (!acceptingDriver?.driving_license?.is_verified) {
          return res.status(400).json({ message: 'You must have a verified driving license to accept this trip.' });
        }
        await User.findByIdAndUpdate(booking.driver, {
          isAvailable: false,
          driverStatus: 'busy',
          currentRide: booking._id,
        });
      }

      booking.status = 'confirmed';
      if (!booking.vehicle && booking.driver) {
        booking.driverAcceptedAt = new Date();
      }
      await createNotification(
        booking.renter,
        'Your booking has been confirmed.',
        'booking_confirmed'
      );
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
      if (booking.owner && booking.paymentStatus === 'paid') {
        booking.payoutStatus = 'pending';
        booking.payoutAmount = booking.payoutAmount || Number(booking.rentalPrice || 0);
      }
      if (booking.vehicle) {
        await Vehicle.findByIdAndUpdate(booking.vehicle, { isAvailable: true });
      }
      if (booking.driver) {
        await User.findByIdAndUpdate(booking.driver, {
          isAvailable: false,
          driverStatus: 'busy',
          currentRide: null,
        });
      }

      await createNotification(
        booking.renter,
        'Your booking has been completed.',
        'booking_completed'
      );
    } else if (status === 'cancelled') {
      const canCancel = [ownerId, driverId, renterId].filter(Boolean).includes(userId);
      if (!canCancel) {
        return res.status(401).json({ message: 'Not authorized to cancel this booking.' });
      }
      if (booking.vehicle && ownerId === userId && booking.paymentStatus === 'paid') {
        return res.status(400).json({ message: 'Paid bookings are confirmed and cannot be declined by the owner.' });
      }

      booking.status = 'cancelled';
      if (booking.driver) {
        await User.findByIdAndUpdate(booking.driver, {
          isAvailable: false,
          driverStatus: 'busy',
          currentRide: null,
        });
      }

      await createNotification(
        booking.renter,
        'Your booking has been cancelled.',
        'booking_cancelled'
      );
    }

    await booking.save();
    scheduleNextBookingExpiry().catch((error) => console.error('Booking expiry schedule failed:', error.message));
    await booking.populate([
      { path: 'vehicle', select: 'make model images' },
      { path: 'renter', select: 'name phone' },
      { path: 'owner', select: 'name' },
      { path: 'driver', select: 'name phone' },
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
      if (booking.owner && booking.paymentStatus === 'paid') {
        booking.payoutStatus = 'pending';
        booking.payoutAmount = booking.payoutAmount || Number(booking.rentalPrice || 0);
      }

      if (booking.driver) {
        await User.findByIdAndUpdate(booking.driver, {
          isAvailable: false,
          driverStatus: 'busy',
          currentRide: null,
        });
      }

      if (booking.vehicle) {
        await Vehicle.findByIdAndUpdate(booking.vehicle, { isAvailable: true });
      }

      await createNotification(
        booking.renter,
        'Your booking has been completed.',
        'booking_completed'
      );
    }

    await booking.save();
    scheduleNextBookingExpiry().catch((error) => console.error('Booking expiry schedule failed:', error.message));
    await booking.populate([
      { path: 'vehicle', select: 'make model images' },
      { path: 'renter', select: 'name phone' },
      { path: 'owner', select: 'name' },
      { path: 'driver', select: 'name phone' },
    ]);
    res.json(booking);
  } catch (error) {
    console.error('Backend Error in finishRide:', error.message);
    res.status(500).json({ message: error.message || 'Finish failed' });
  }
};

// @desc    Admin: record a completed booking payout as sent
// @route   PATCH /api/bookings/:id/payout
const markPayoutSent = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as an admin.' });
    }

    const booking = await Booking.findById(req.params.id).populate('owner', 'role payoutInfo');
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (!booking.owner || booking.owner.role !== 'agency') {
      return res.status(400).json({ message: 'This booking does not have an agency payout.' });
    }
    if (booking.status !== 'completed' || booking.paymentStatus !== 'paid' || booking.payoutStatus !== 'pending') {
      return res.status(400).json({ message: 'This payout is not ready to be sent.' });
    }
    const { method, accountNumber, accountName } = booking.owner.payoutInfo || {};
    if (!method || !accountNumber || !accountName) {
      return res.status(400).json({ message: 'The agency has not completed payout settings.' });
    }

    booking.payoutStatus = 'sent';
    booking.payoutSentAt = new Date();
    booking.payoutSentBy = req.user._id;
    await booking.save();
    res.json({
      _id: booking._id,
      payoutStatus: booking.payoutStatus,
      payoutAmount: booking.payoutAmount,
      payoutSentAt: booking.payoutSentAt,
      payoutSentBy: booking.payoutSentBy,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not mark payout as sent.', error: error.message });
  }
};

module.exports = { createBooking, getMyBookings, updateBookingStatus, finishRide, checkVehicleAvailability, markPayoutSent };
