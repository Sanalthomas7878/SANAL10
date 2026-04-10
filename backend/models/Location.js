const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  pinCode: { type: String, required: true, unique: true },
  areaName: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  isServiceable: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);
