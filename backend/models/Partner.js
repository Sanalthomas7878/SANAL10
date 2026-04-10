const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String },
  status: { type: String, enum: ['Pending', 'Contacted', 'Partnered'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Partner', partnerSchema);
