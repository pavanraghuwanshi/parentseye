const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const parentSchema = new mongoose.Schema({
  parentName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child'
  }],
  resetToken: String,
  resetTokenExpires: Date,
  fcmToken: {
    type: String
  },
  vehicleId: { type: String, default: null },
});
parentSchema.pre('save', async function (next) {
  const parent = this;
  if (!parent.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(parent.password, salt);
    parent.password = hashedPassword;
    next();
  } catch (err) {
    return next(err);
  }
});
parentSchema.methods.comparePassword = async function (password) {
  try {
    const isMatch = await bcrypt.compare(password, this.password);
    return isMatch;
  } catch (err) {
    throw err;
  }
};
const Parent = mongoose.model('Parent', parentSchema);
module.exports = Parent;
