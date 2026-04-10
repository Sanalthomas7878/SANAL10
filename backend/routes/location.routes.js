const express = require('express');
const router = express.Router();
const { checkServiceability, getServiceableLocations } = require('../controllers/location.controller');

router.get('/', getServiceableLocations);
router.get('/check/:pinCode', checkServiceability);

module.exports = router;
