const express = require('express');
const router = express.Router();
const { becomePartner, getPartners } = require('../controllers/partner.controller');

router.get('/', getPartners);
router.post('/apply', becomePartner);

module.exports = router;
