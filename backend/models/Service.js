const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  serviceGroup: { type: String, enum: ['service', 'homeService'], default: 'service' },
  description: { type: String },
  basePrice: { type: Number, required: true },
  imageUrl: { type: String },
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
