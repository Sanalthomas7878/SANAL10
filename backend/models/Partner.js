const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  contactPerson: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  selectedServices: { type: [String], default: [] },
  selectedScrapCategories: { type: [String], default: [] },
  companyScrapDescription: { type: String, required: true, trim: true },
  expectedMonthlyVolumeKg: { type: Number, min: 0, default: 0 },
  hasOver15KgScrap: { type: Boolean, default: false },
  message: { type: String },
  status: { type: String, enum: ['Pending', 'Contacted', 'Partnered'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Partner', partnerSchema);
