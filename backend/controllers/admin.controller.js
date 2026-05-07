const Booking = require('../models/Booking');
const Partner = require('../models/Partner');
const ScrapCategory = require('../models/ScrapCategory');
const Service = require('../models/Service');
const Location = require('../models/Location');
const User = require('../models/User');

const VALID_BOOKING_STATUSES = ['Pending', 'Accepted', 'Rejected', 'Completed'];
const VALID_PARTNER_STATUSES = ['Pending', 'Contacted', 'Partnered'];

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalBookings, pendingBookings, totalPartners, pendingPartners] = await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'Pending' }),
      Partner.countDocuments(),
      Partner.countDocuments({ status: 'Pending' }),
    ]);

    res.json({ totalUsers, totalBookings, pendingBookings, totalPartners, pendingPartners });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCatalogData = async (req, res) => {
  try {
    const [categories, services] = await Promise.all([
      ScrapCategory.find().sort({ name: 1 }),
      Service.find().sort({ serviceGroup: 1, name: 1 }),
    ]);

    res.json({ categories, services });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('user').populate('item').sort('-createdAt');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  const { status } = req.body;

  if (!VALID_BOOKING_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Please choose a valid booking status.' });
  }

  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('user')
      .populate('item');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find().sort({ createdAt: -1 });
    res.json(partners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePartnerStatus = async (req, res) => {
  const { status } = req.body;

  if (!VALID_PARTNER_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Please choose a valid partner status.' });
  }

  try {
    const partner = await Partner.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!partner) {
      return res.status(404).json({ message: 'Partner application not found.' });
    }

    res.json(partner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateScrapCategory = async (req, res) => {
  const { basePrice, imageUrl } = req.body;
  const parsedBasePrice = Number(basePrice);

  if (Number.isNaN(parsedBasePrice) || parsedBasePrice < 0) {
    return res.status(400).json({ message: 'Please enter a valid scrap price.' });
  }

  try {
    const category = await ScrapCategory.findByIdAndUpdate(
      req.params.id,
      {
        basePrice: parsedBasePrice,
        imageUrl: String(imageUrl || '').trim(),
      },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Scrap category not found.' });
    }

    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateServiceCatalogItem = async (req, res) => {
  const { basePrice, imageUrl } = req.body;
  const parsedBasePrice = Number(basePrice);

  if (Number.isNaN(parsedBasePrice) || parsedBasePrice < 0) {
    return res.status(400).json({ message: 'Please enter a valid service price.' });
  }

  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      {
        basePrice: parsedBasePrice,
        imageUrl: String(imageUrl || '').trim(),
      },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }

    res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
