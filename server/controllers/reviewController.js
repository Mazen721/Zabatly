const Review = require('../models/Review');
const Vehicle = require('../models/vehicle');
const User = require('../models/User');

// @desc    Create a new review & update averages
// @route   POST /api/reviews
const createReview = async (req, res) => {
  const { targetUser, targetVehicle, bookingReference, rating, comment } = req.body;

  try {
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
                                .populate('author', 'name profilePicture');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { createReview, getVehicleReviews };