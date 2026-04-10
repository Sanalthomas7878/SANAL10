const express = require('express');
const router = express.Router();
const { getCategories, createBooking, getUserBookings } = require('../controllers/scrap.controller');
const { protect } = require('../middleware/auth');

router.get('/categories', getCategories);
router.post('/book', protect, createBooking);
router.get('/mybookings', protect, getUserBookings);

module.exports = router;
