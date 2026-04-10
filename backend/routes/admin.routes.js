const express = require('express');
const router = express.Router();
const { getDashboardStats, getAllBookings, updateBookingStatus } = require('../controllers/admin.controller');
const { protect, admin } = require('../middleware/auth');

router.get('/stats', protect, admin, getDashboardStats);
router.get('/bookings', protect, admin, getAllBookings);
router.put('/bookings/:id/status', protect, admin, updateBookingStatus);

module.exports = router;
