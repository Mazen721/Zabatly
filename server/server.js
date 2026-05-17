const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Allows server to accept JSON data
app.use('/api/admin', require('./routes/adminRoutes'));

// --- STATIC FOLDER (For Images) ---
// This allows the frontend to access images at http://localhost:5000/uploads/filename.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- ROUTES ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users')); // KYC Verification is securely handled inside here!
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));

// AI Chat route is live!
app.use('/api/chat', require('./routes/ai'));

// Basic Route
app.get('/', (req, res) => {
  res.send('API is running and Database is Connected...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});