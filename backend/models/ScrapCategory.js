const mongoose = require('mongoose');

const scrapCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  basePrice: { type: Number, required: true },
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ScrapCategory', scrapCategorySchema);
