const Partner = require('../models/Partner');
const { formatIndianPhone, getIndianPhoneValidationMessage } = require('../utils/phone');

const normalizeSelections = (values) => (
  Array.isArray(values)
    ? values.map((value) => String(value || '').trim()).filter(Boolean)
    : []
);

const parseBoolean = (value) => value === true || value === 'true';

exports.becomePartner = async (req, res) => {
  const {
    companyName,
    contactPerson,
    email,
    phone,
    selectedServices,
    selectedScrapCategories,
    companyScrapDescription,
    expectedMonthlyVolumeKg,
    hasOver15KgScrap,
    message,
  } = req.body;

  try {
    const normalizedServices = normalizeSelections(selectedServices);
    const normalizedScrapCategories = normalizeSelections(selectedScrapCategories);
    const normalizedCompanyName = String(companyName || '').trim();
    const normalizedContactPerson = String(contactPerson || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPhone = String(phone || '').trim();
    const normalizedCompanyScrapDescription = String(companyScrapDescription || '').trim();
    const parsedExpectedMonthlyVolumeKg = Number(expectedMonthlyVolumeKg || 0);

    if (!normalizedCompanyName || !normalizedContactPerson || !normalizedEmail || !normalizedPhone || !normalizedCompanyScrapDescription) {
      return res.status(400).json({ message: 'Please provide complete partner details.' });
    }

    const phoneValidationMessage = getIndianPhoneValidationMessage(normalizedPhone);
    if (phoneValidationMessage) {
      return res.status(400).json({ message: phoneValidationMessage });
    }

    if (normalizedServices.length === 0 && normalizedScrapCategories.length === 0) {
      return res.status(400).json({ message: 'Please choose at least one service or scrap category.' });
    }

    if (Number.isNaN(parsedExpectedMonthlyVolumeKg) || parsedExpectedMonthlyVolumeKg < 0) {
      return res.status(400).json({ message: 'Please enter a valid expected monthly scrap volume.' });
    }

    const partner = await Partner.create({
      companyName: normalizedCompanyName,
      contactPerson: normalizedContactPerson,
      email: normalizedEmail,
      phone: formatIndianPhone(normalizedPhone),
      selectedServices: normalizedServices,
      selectedScrapCategories: normalizedScrapCategories,
      companyScrapDescription: normalizedCompanyScrapDescription,
      expectedMonthlyVolumeKg: parsedExpectedMonthlyVolumeKg,
      hasOver15KgScrap: parseBoolean(hasOver15KgScrap),
      message: String(message || '').trim(),
    });
    res.status(201).json({ success: true, partner });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPartners = async (req, res) => {
  try {
    const partners = await Partner.find({ status: 'Partnered' }).sort({ updatedAt: -1, createdAt: -1 });
    res.json(partners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
