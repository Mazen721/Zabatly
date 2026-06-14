const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const Notification = require('../models/Notification');
const User = require('../models/User');

// POST /api/contact — Submit a contact form message
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required.' });
    }

    const contactMsg = await ContactMessage.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || '',
      subject: subject.trim(),
      message: message.trim(),
    });

    // Notify all admins about the new contact message
    try {
      const admins = await User.find({ role: 'admin' }).select('_id');
      if (admins.length > 0) {
        const notifications = admins.map((admin) => ({
          userId: admin._id,
          message: `New contact message from ${name}: "${subject}"`,
          type: 'new_booking_request', // reuse existing enum type for admin notifications
        }));
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error('Failed to notify admins about contact message:', notifErr.message);
      // Don't fail the request just because notifications failed
    }

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!',
      data: contactMsg,
    });
  } catch (err) {
    console.error('Contact form error:', err.message);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

// GET /api/contact — Admin: Get all contact messages
router.get('/', async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contact messages.' });
  }
});

// PATCH /api/contact/:id/read — Mark a message as read
router.patch('/:id/read', async (req, res) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!msg) return res.status(404).json({ error: 'Message not found.' });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message.' });
  }
});

// DELETE /api/contact/:id — Delete a contact message
router.delete('/:id', async (req, res) => {
  try {
    const msg = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found.' });
    res.json({ success: true, message: 'Message deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

module.exports = router;
