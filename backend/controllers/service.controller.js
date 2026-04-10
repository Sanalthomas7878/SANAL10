const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Location = require('../models/Location');
const { OPERATING_MODES } = require('../data/seedData');
const { buildLocationAddress } = require('../utils/locationAddress');

exports.getServices = async (req, res) => {
  try {
    const services = await Service.find({ isAvailable: true }).sort({ serviceGroup: 1, name: 1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.bookService = async (req, res) => {
  const { serviceId, scheduledAt, address, pinCode, notes, quantity, operatingMode } = req.body;

  try {
    const parsedQuantity = Number(quantity) || 1;
    if (!serviceId || !scheduledAt || !pinCode || parsedQuantity <= 0) {
      return res.status(400).json({ message: 'Please provide complete booking details.' });
    }

    const loc = await Location.findOne({ pinCode, isServiceable: true });
    if (!loc) {
      return res.status(400).json({ message: 'Sorry, we do not service this pin code yet.' });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.isAvailable) {
      return res.status(404).json({ message: 'Selected service is not available.' });
    }

    if (operatingMode && !OPERATING_MODES.includes(operatingMode)) {
      return res.status(400).json({ message: 'Please choose a valid operating mode.' });
    }

    const booking = await Booking.create({
      user: req.user._id,
      bookingType: 'service',
      item: serviceId,
      itemModel: 'Service',
      weightOrQuantity: parsedQuantity,
      scheduledAt,
      address: address?.trim() || buildLocationAddress(loc),
      areaName: loc.areaName,
      city: loc.city,
      state: loc.state,
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
