const Notification = require('../models/Notification');

const createNotification = async (userId, message, type) => {
  if (!userId || !message || !type) return null;
  return Notification.create({ userId, message, type });
};

module.exports = { createNotification };
