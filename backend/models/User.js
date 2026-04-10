const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  pinCode: { type: String, required: true },
  areaName: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true, default: 'Karnataka' },
  operatingMode: {
    type: String,
    enum: ['Doorstep Scrap Pickup', 'Business Bulk Clearance'],
    default: 'Doorstep Scrap Pickup',
  },
  role: { type: String, enum: ['customer', 'admin', 'corporate'], default: 'customer' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
