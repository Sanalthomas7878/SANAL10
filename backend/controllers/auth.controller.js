const User = require('../models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Location = require('../models/Location');
const { OPERATING_MODES } = require('../data/seedData');
const { buildLocationAddress } = require('../utils/locationAddress');
const { formatIndianPhone, getIndianPhoneValidationMessage } = require('../utils/phone');
const { hasMailConfig, sendMail } = require('../utils/mailer');

const RESET_PASSWORD_WINDOW_MS = 15 * 60 * 1000;

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

const buildResetPasswordOtp = () => String(crypto.randomInt(100000, 1000000));

const hashResetPasswordOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

const sendResetPasswordOtpEmail = async ({ email, fullName, otp }) => {
  const subject = 'EcoScrap Pro password reset OTP';
  const greetingName = fullName?.trim() || 'there';
  const text = [
    `Hello ${greetingName},`,
    '',
    `Your EcoScrap Pro password reset OTP is ${otp}.`,
    'This OTP will expire in 15 minutes.',
    '',
    'If you did not request this, you can safely ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <p>Hello ${greetingName},</p>
      <p>Your EcoScrap Pro password reset OTP is:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #0f766e;">${otp}</p>
      <p>This OTP will expire in 15 minutes.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  await sendMail({
    to: email,
    subject,
    text,
    html,
  });
};

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

exports.forgotPassword = async (req, res) => {
  const normalizedEmail = req.body.email?.trim().toLowerCase();
  const message = 'If an account exists for that email, a password reset OTP has been sent.';

  try {
    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.json({ message });
    }

    const otp = buildResetPasswordOtp();
    const mailConfigured = hasMailConfig();

    if (!mailConfigured) {
      return res.status(503).json({
        message: 'Email delivery is not configured yet. Add SMTP settings in backend/.env to send real OTP emails.',
      });
    }

    user.resetPasswordOtpHash = hashResetPasswordOtp(otp);
    user.resetPasswordExpires = new Date(Date.now() + RESET_PASSWORD_WINDOW_MS);
    await user.save();

    await sendResetPasswordOtpEmail({
      email: user.email,
      fullName: user.fullName,
      otp,
    });

    res.json({ message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const normalizedEmail = req.body.email?.trim().toLowerCase();
  const otp = req.body.otp?.trim();
  const { password } = req.body;

  try {
    if (!normalizedEmail || !otp || !password) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordOtpHash: hashResetPasswordOtp(otp),
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'This OTP is invalid or has expired.' });
    }

    user.password = password;
    user.resetPasswordOtpHash = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password updated successfully. You can now log in.' });
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
