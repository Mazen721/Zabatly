const Review = require('../models/Review');
const Vehicle = require('../models/vehicle');
const User = require('../models/User');
const Booking = require('../models/booking');

const getRentalEndDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0
  ) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
};

const isReviewableBooking = (booking) => {
  const end = getRentalEndDate(booking.endDate);
  return ['completed', 'expired'].includes(booking.status) || Boolean(end && end < new Date());
};

// @desc    Create a new review & update averages
// @route   POST /api/reviews
const createReview = async (req, res) => {
  const { targetUser, targetVehicle, bookingReference, rating, comment } = req.body;

  try {
    const booking = await Booking.findById(bookingReference);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.renter?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the renter can review this booking.' });
    }

    if (targetVehicle && booking.vehicle?.toString() !== targetVehicle.toString()) {
      return res.status(400).json({ message: 'This booking does not match that vehicle.' });
    }

    if (!isReviewableBooking(booking)) {
      return res.status(400).json({ message: 'You can review after the rental ends.' });
    }

    const existingReview = await Review.findOne({
      author: req.user._id,
      bookingReference,
      ...(targetVehicle ? { targetVehicle } : {}),
      ...(targetUser ? { targetUser } : {}),
    });
    if (existingReview) {
      return res.status(409).json({ message: 'You already reviewed this booking.' });
    }

    // 1. Create and save the review
    const review = new Review({
      author: req.user._id,
      targetUser,
      targetVehicle,
      bookingReference,
      rating: Number(rating),
      comment
    });
    await review.save();

    // 2. RECALCULATE VEHICLE RATING (If reviewing a car)
    if (targetVehicle) {
      const vehicleReviews = await Review.find({ targetVehicle });
      const numReviews = vehicleReviews.length;
      const totalRating = vehicleReviews.reduce((acc, item) => item.rating + acc, 0);
      const newAverage = totalRating / numReviews;

      await Vehicle.findByIdAndUpdate(targetVehicle, {
        rating: newAverage.toFixed(1),
        numReviews: numReviews
      });
    }

    // 3. RECALCULATE USER RATING (If reviewing an Owner or Driver)
    if (targetUser) {
      const userReviews = await Review.find({ targetUser });
      const numReviews = userReviews.length;
      const totalRating = userReviews.reduce((acc, item) => item.rating + acc, 0);
      const newAverage = totalRating / numReviews;

      await User.findByIdAndUpdate(targetUser, {
        rating: newAverage.toFixed(1),
        numReviews: numReviews
      });
    }

    res.status(201).json({ message: 'Review added successfully', review });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to submit review', error: error.message });
  }
};

// @desc    Get reviews for a specific vehicle
// @route   GET /api/reviews/vehicle/:vehicleId
const getVehicleReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ targetVehicle: req.params.vehicleId })
                                .populate('author', 'name profilePicture profilePhoto');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { createReview, getVehicleReviews };
