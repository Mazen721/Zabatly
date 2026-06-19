const Booking = require('../models/booking');
const User = require('../models/User');
const Vehicle = require('../models/vehicle');

const blockingStatuses = ['pending', 'confirmed', 'active'];
let expiryTimer = null;

const releaseExpiredBookings = async (now = new Date()) => {
  const expired = await Booking.find({
    status: { $in: blockingStatuses },
    endDate: { $ne: null, $lte: now },
  }).select('_id vehicle driver owner status paymentStatus rentalPrice');

  if (expired.length === 0) return { expiredCount: 0 };

  const activeIds = expired.filter((booking) => booking.status === 'active').map((booking) => booking._id);
  const inactiveIds = expired.filter((booking) => booking.status !== 'active').map((booking) => booking._id);

  if (activeIds.length > 0) {
    const activeBookings = expired.filter((booking) => booking.status === 'active');
    await Booking.updateMany(
      { _id: { $in: activeIds } },
      {
        $set: {
          status: 'completed',
          renterFinished: true,
          driverFinished: true,
        },
      }
    );
    const eligiblePayouts = activeBookings.filter((booking) => booking.owner && booking.paymentStatus === 'paid');
    if (eligiblePayouts.length > 0) {
      await Booking.bulkWrite(eligiblePayouts.map((booking) => ({
        updateOne: {
          filter: { _id: booking._id },
          update: { $set: { payoutStatus: 'pending', payoutAmount: Number(booking.rentalPrice || 0) } },
        },
      })));
    }
  }

  if (inactiveIds.length > 0) {
    await Booking.updateMany(
      { _id: { $in: inactiveIds } },
      { $set: { status: 'expired' } }
    );
  }

  const vehicleIds = [...new Set(expired.filter((booking) => booking.vehicle).map((booking) => booking.vehicle.toString()))];
  const driverIds = [...new Set(expired.filter((booking) => booking.driver).map((booking) => booking.driver.toString()))];

  await Promise.all([
    ...vehicleIds.map(async (vehicleId) => {
      const activeRental = await Booking.exists({
        vehicle: vehicleId,
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gt: now },
      });
      if (!activeRental) {
        await Vehicle.findByIdAndUpdate(vehicleId, { isAvailable: true });
      }
    }),
    ...driverIds.map(async (driverId) => {
      const activeRide = await Booking.exists({
        driver: driverId,
        status: { $in: blockingStatuses },
        endDate: { $gt: now },
      });
      if (!activeRide) {
        await User.findByIdAndUpdate(driverId, { currentRide: null });
      }
    }),
  ]);

  return { expiredCount: expired.length };
};

const scheduleNextBookingExpiry = async () => {
  if (expiryTimer) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }

  const nextBooking = await Booking.findOne({
    status: { $in: blockingStatuses },
    endDate: { $gt: new Date() },
  })
    .select('endDate')
    .sort({ endDate: 1 })
    .lean();

  if (!nextBooking?.endDate) return;

  const delay = Math.max(250, Math.min(new Date(nextBooking.endDate).getTime() - Date.now() + 250, 2147483647));
  expiryTimer = setTimeout(async () => {
    try {
      await releaseExpiredBookings();
      await scheduleNextBookingExpiry();
    } catch (error) {
      console.error('Booking expiry sync failed:', error.message);
    }
  }, delay);

  if (typeof expiryTimer.unref === 'function') expiryTimer.unref();
};

module.exports = { releaseExpiredBookings, scheduleNextBookingExpiry, blockingStatuses };
