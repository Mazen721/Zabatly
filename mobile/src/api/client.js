import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Base Configuration ─────────────────────────────────────────────────
// Replace with your Railway deployment URL before shipping.
// During local development you can point to your machine's IP, e.g.
// 'http://192.168.x.x:5000' (not localhost — the emulator can't reach it).
const BASE_URL = 'https://zabatly-production.up.railway.app';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor ────────────────────────────────────────────────
// Reads the JWT from AsyncStorage on every request and attaches it.
// If no token is stored the request goes out unauthenticated (public routes).
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // AsyncStorage read failed — proceed without token
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ───────────────────────────────────────────────
// Normalizes errors so callers always get a useful message string.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with a non-2xx status
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        `Request failed (${error.response.status})`;
      return Promise.reject(new Error(message));
    }
    if (error.request) {
      return Promise.reject(new Error('No response from server. Check your connection.'));
    }
    return Promise.reject(error);
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// API Functions — Renter-focused endpoints
// ═══════════════════════════════════════════════════════════════════════════

// ─── Auth ───────────────────────────────────────────────────────────────
// POST /api/auth/register
export const register = (data) => api.post('/api/auth/register', data);

// POST /api/auth/login
export const login = (data) => api.post('/api/auth/login', data);

// ─── Vehicles ───────────────────────────────────────────────────────────
// GET /api/vehicles
export const getVehicles = (params) => api.get('/api/vehicles', { params });

// GET /api/vehicles/:id
export const getVehicleById = (id) => api.get(`/api/vehicles/${id}`);

// ─── Bookings ───────────────────────────────────────────────────────────
// POST /api/bookings
// Supports multipart/form-data when a payment proof image is attached.
export const createBooking = (data) => {
  if (data instanceof FormData) {
    return api.post('/api/bookings', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return api.post('/api/bookings', data);
};

// GET /api/bookings   (returns the current user's bookings)
export const getMyBookings = () => api.get('/api/bookings');

// GET /api/bookings/availability?vehicleId=...&startDate=...&endDate=...
export const checkAvailability = (params) =>
  api.get('/api/bookings/availability', { params });

// PUT /api/bookings/:id (cancels a booking)
export const cancelBooking = (id) =>
  api.put(`/api/bookings/${id}`, { status: 'cancelled' });

// ─── Users / Profile ────────────────────────────────────────────────────
// GET /api/users/profile
export const getProfile = () => api.get('/api/users/profile');

// PUT /api/users/profile
// Supports multipart/form-data for profile photo upload.
export const updateProfile = (data) => {
  if (data instanceof FormData) {
    return api.put('/api/users/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return api.put('/api/users/profile', data);
};

// POST /api/users/kyc/verify
// Always multipart — sends the KYC document image + type.
export const submitKYC = (formData) =>
  api.post('/api/users/kyc/verify', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ─── Reviews ────────────────────────────────────────────────────────────
// GET /api/reviews/vehicle/:vehicleId
export const getVehicleReviews = (vehicleId) =>
  api.get(`/api/reviews/vehicle/${vehicleId}`);

// POST /api/reviews
export const createReview = (data) => api.post('/api/reviews', data);

// ─── Notifications ──────────────────────────────────────────────────────
// GET /api/notifications
export const getNotifications = () => api.get('/api/notifications');

// GET /api/notifications/unread-count
export const getUnreadCount = () => api.get('/api/notifications/unread-count');

// PATCH /api/notifications/read-all
export const markAllNotificationsRead = () =>
  api.patch('/api/notifications/read-all');

// PATCH /api/notifications/:id/read
export const markNotificationRead = (id) =>
  api.patch(`/api/notifications/${id}/read`);

// ─── AI Chat ────────────────────────────────────────────────────────────
// POST /api/chat
export const chat = (data) => api.post('/api/chat', data);

// ─── Driver Requests (renter creates requests for a driver) ─────────────
// POST /api/driver-requests
export const createDriverRequest = (data) =>
  api.post('/api/driver-requests', data);

// GET /api/driver-requests/my
export const getMyDriverRequests = () => api.get('/api/driver-requests/my');

// PATCH /api/driver-requests/:id/cancel
export const cancelDriverRequest = (id) =>
  api.patch(`/api/driver-requests/${id}/cancel`);

// ─── Drivers (browse available drivers) ─────────────────────────────────
// GET /api/users/drivers
export const getDrivers = () => api.get('/api/users/drivers');

// ─── Geocode ────────────────────────────────────────────────────────────
// GET /api/geocode/reverse?lat=...&lng=...
export const reverseGeocode = (params) =>
  api.get('/api/geocode/reverse', { params });

export default api;
