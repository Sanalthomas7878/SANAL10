const express = require('express');
const router = express.Router();
const { getServices, bookService } = require('../controllers/service.controller');
const { protect } = require('../middleware/auth');

router.get('/', getServices);
router.post('/book', protect, bookService);

module.exports = router;
