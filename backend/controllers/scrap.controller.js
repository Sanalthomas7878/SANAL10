const ScrapCategory = require('../models/ScrapCategory');
const Booking = require('../models/Booking');
const Location = require('../models/Location');
const { OPERATING_MODES } = require('../data/seedData');
const { validateScheduledAt } = require('../utils/bookingSchedule');
const { buildLocationAddress } = require('../utils/locationAddress');

exports.getCategories = async (req, res) => {
  try {
    const categories = await ScrapCategory.find({ isActive: true }).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createBooking = async (req, res) => {
  const { categoryId, weight, scheduledAt, address, latitude, longitude, pinCode, notes, operatingMode } = req.body;

  try {
    const parsedWeight = Number(weight);
    if (!categoryId || !scheduledAt || !pinCode || Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      return res.status(400).json({ message: 'Please provide complete scrap booking details.' });
    }

    const loc = await Location.findOne({ pinCode, isServiceable: true });
    if (!loc) {
      return res.status(400).json({ message: 'Sorry, we do not service this pin code yet.' });
    }

    const category = await ScrapCategory.findById(categoryId);
    if (!category || !category.isActive) {
      return res.status(404).json({ message: 'Selected scrap category is not available.' });
    }

    if (operatingMode && !OPERATING_MODES.includes(operatingMode)) {
      return res.status(400).json({ message: 'Please choose a valid operating mode.' });
    }

    const { isValid, message, parsedScheduledAt } = validateScheduledAt(scheduledAt);
    if (!isValid) {
      return res.status(400).json({ message });
    }

    const booking = await Booking.create({
      user: req.user._id,
      bookingType: 'scrap',
      item: categoryId,
      itemModel: 'ScrapCategory',
      weightOrQuantity: parsedWeight,
      scheduledAt: parsedScheduledAt,
      address: address?.trim() || buildLocationAddress(loc),
      areaName: loc.areaName,
      city: loc.city,
      state: loc.state,
      latitude,
      longitude,
      pinCode: loc.pinCode,
      operatingMode: operatingMode || req.user.operatingMode || OPERATING_MODES[0],
      notes
    });

    const populatedBooking = await Booking.findById(booking._id).populate('item');
    res.status(201).json(populatedBooking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate('item').sort('-createdAt');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
