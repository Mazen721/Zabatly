const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const publicUserPayload = (user) => ({
  _id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  is_verified: user.is_verified,
  profilePicture: user.profilePhoto || user.profilePicture,
  profilePhoto: user.profilePhoto || user.profilePicture,
  age: user.age,
  dateOfBirth: user.dateOfBirth,
  gender: user.gender,
  phone: user.phone,
  city: user.city,
  nationality: user.nationality,
  preferredLanguage: user.preferredLanguage,
  emergencyContact: user.emergencyContact,
  rating: user.rating,
  numReviews: user.numReviews,
  kyc_status: user.kyc_status,
  driving_license: user.driving_license,
  isAvailable: user.isAvailable,
  driverStatus: user.driverStatus,
  dailyRate: user.dailyRate,
  currentLocation: user.currentLocation,
  coveredAreas: user.coveredAreas,
  availability: user.availability,
  drivingExperience: user.drivingExperience,
  vehicleTypes: user.vehicleTypes,
  licenseInfo: user.licenseInfo,
  languagesSpoken: user.languagesSpoken,
  contactDetails: user.contactDetails,
  token: generateToken(user.id),
});

const isStrongPassword = (password = '') =>
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

// @desc    Register new user with Master Admin Lock
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    phone,
    age,
    dateOfBirth,
    gender,
    city,
    nationality,
    preferredLanguage,
    emergencyContact,
    currentLocation,
    coveredAreas,
    availability,
    drivingExperience,
    vehicleTypes,
    licenseInfo,
    languagesSpoken,
    contactDetails,
  } = req.body;

  try {
    const cleanEmail = email.toLowerCase();
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // ==========================================
    // 🛡️ THE MAZEN SECURITY GUARD
    // ==========================================
    let assignedRole = role || 'user';

    if (cleanEmail === 'mazen@admin.com') {
      // You can only be Mazen if you know the master password
      if (password !== '12345') {
         return res.status(401).json({ message: 'Unauthorized: Incorrect master admin password.' });
      }
      assignedRole = 'admin';
    } else if (assignedRole === 'admin') {
      // Prevent anyone else from trying to "inject" an admin role
      assignedRole = 'user';
    }

    if (assignedRole !== 'admin' && !isStrongPassword(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters and include one uppercase letter and one symbol.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: cleanEmail,
      password: hashedPassword,
      role: assignedRole,
      phone,
      age,
      dateOfBirth: dateOfBirth || undefined,
      gender,
      city,
      nationality,
      preferredLanguage,
      emergencyContact,
      currentLocation,
      coveredAreas,
      availability,
      drivingExperience,
      vehicleTypes,
      licenseInfo,
      languagesSpoken,
      contactDetails
    });

    if (user) {
      res.status(201).json(publicUserPayload(user));
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid user data', error: error.message });
  }
};

// @desc    Login (Case-Insensitive)
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json(publicUserPayload(user));
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
     res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser };
