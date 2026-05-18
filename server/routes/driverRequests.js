const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createDriverRequest,
  getMyRequests,
  updateRequestStatus,
  cancelRequest,
  completeRequest,
} = require('../controllers/driverRequestController');

const requireRole = (...roles) => (req, res, next) => {
  if (req.user && roles.includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Not authorized for this action' });
};

router.post('/', protect, requireRole('user'), createDriverRequest);
router.get('/my', protect, getMyRequests);
router.patch('/:id/status', protect, requireRole('driver'), updateRequestStatus);
router.patch('/:id/cancel', protect, requireRole('user'), cancelRequest);
router.patch('/:id/complete', protect, requireRole('driver'), completeRequest);

module.exports = router;
