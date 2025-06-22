const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: 300 }
  },
  verified: {
    type: Boolean,
    default: false
  },
  type: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Otp', OtpSchema);