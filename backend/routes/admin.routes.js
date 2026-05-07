const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  getCatalogData,
  getAllBookings,
  updateBookingStatus,
  getAllPartners,
  updatePartnerStatus,
  updateScrapCategory,
  updateServiceCatalogItem,
} = require('../controllers/admin.controller');
const { protect, admin } = require('../middleware/auth');

router.get('/stats', protect, admin, getDashboardStats);
router.get('/users', protect, admin, getAllUsers);
router.get('/catalog', protect, admin, getCatalogData);
router.get('/bookings', protect, admin, getAllBookings);
router.put('/bookings/:id/status', protect, admin, updateBookingStatus);
router.get('/partners', protect, admin, getAllPartners);
router.put('/partners/:id/status', protect, admin, updatePartnerStatus);
router.put('/catalog/scrap/:id', protect, admin, updateScrapCategory);
router.put('/catalog/services/:id', protect, admin, updateServiceCatalogItem);

module.exports = router;
