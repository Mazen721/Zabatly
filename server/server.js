const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { releaseExpiredBookings, scheduleNextBookingExpiry } = require('./utils/bookingExpiration');

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Allows server to accept JSON data
app.use('/api/admin', require('./routes/adminRoutes'));

// --- ROUTES ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users')); // KYC Verification is securely handled inside here!
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/driver-requests', require('./routes/driverRequests'));
app.use('/api/geocode', require('./routes/geocode'));

// AI Chat route is live!
app.use('/api/chat', require('./routes/ai'));

// Basic Route
app.get('/', (req, res) => {
  res.send('API is running and Database is Connected...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  releaseExpiredBookings()
    .then(() => scheduleNextBookingExpiry())
    .catch((error) => console.error('Booking expiry sync failed:', error.message));
  setInterval(() => {
    releaseExpiredBookings()
      .then(() => scheduleNextBookingExpiry())
      .catch((error) => console.error('Booking expiry sync failed:', error.message));
  }, 60 * 1000);
});
