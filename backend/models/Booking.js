const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingType: { type: String, enum: ['scrap', 'service'], required: true },
  item: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'itemModel' },
  itemModel: { type: String, enum: ['ScrapCategory', 'Service'], required: true },
  weightOrQuantity: { type: Number, required: true },
  scheduledAt: { type: Date, required: true },
  address: { type: String, required: true },
  areaName: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true, default: 'Karnataka' },
  latitude: { type: Number },
  longitude: { type: Number },
  pinCode: { type: String, required: true },
  operatingMode: {
    type: String,
    enum: ['Doorstep Scrap Pickup', 'Business Bulk Clearance'],
    default: 'Doorstep Scrap Pickup',
  },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected', 'Completed'], default: 'Pending' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
