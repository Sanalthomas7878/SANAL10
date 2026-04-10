const Partner = require('../models/Partner');

exports.becomePartner = async (req, res) => {
  const { companyName, contactPerson, email, phone, message } = req.body;

  try {
    const partner = await Partner.create({
      companyName,
      contactPerson,
      email,
      phone,
      message
    });
    res.status(201).json({ success: true, partner });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPartners = async (req, res) => {
  try {
    const partners = await Partner.find({ status: 'Partnered' });
    res.json(partners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
