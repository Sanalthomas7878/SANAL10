const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Location = require('../models/Location');
const { OPERATING_MODES } = require('../data/seedData');
const { buildLocationAddress } = require('../utils/locationAddress');
const { formatIndianPhone, getIndianPhoneValidationMessage } = require('../utils/phone');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

const buildAuthResponse = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  address: user.address,
  pinCode: user.pinCode,
  areaName: user.areaName,
  city: user.city,
  state: user.state,
  operatingMode: user.operatingMode,
  role: user.role,
  token: generateToken(user._id),
});

exports.registerUser = async (req, res) => {
  const { fullName, email, password, phone, address, pinCode, operatingMode } = req.body;

  try {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!fullName || !normalizedEmail || !password || !phone || !pinCode) {
      return res.status(400).json({ message: 'Please fill all required registration fields.' });
    }

    const phoneValidationMessage = getIndianPhoneValidationMessage(phone);
    if (phoneValidationMessage) {
      return res.status(400).json({ message: phoneValidationMessage });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const location = await Location.findOne({ pinCode, isServiceable: true });
    if (!location) {
      return res.status(400).json({ message: 'Please choose a serviceable area pin code.' });
    }

    if (operatingMode && !OPERATING_MODES.includes(operatingMode)) {
      return res.status(400).json({ message: 'Please choose a valid operating mode.' });
    }

    const user = await User.create({
      fullName,
      email: normalizedEmail,
      password,
      phone: formatIndianPhone(phone),
      address: address?.trim() || buildLocationAddress(location),
      pinCode: location.pinCode,
      areaName: location.areaName,
      city: location.city,
      state: location.state,
      operatingMode: operatingMode || OPERATING_MODES[0],
    });

    if (user) {
      res.status(201).json(buildAuthResponse(user));
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (user && (await user.matchPassword(password))) {
      if (!user.isActive) {
        return res.status(403).json({ message: 'This account is currently inactive.' });
      }

      res.json(buildAuthResponse(user));
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        pinCode: user.pinCode,
        areaName: user.areaName,
        city: user.city,
        state: user.state,
        operatingMode: user.operatingMode,
        role: user.role
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
