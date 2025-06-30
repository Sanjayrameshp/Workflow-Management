const mongoose = require('mongoose');

const InviteTokenSchema = new mongoose.Schema({
  email: { type: String, required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  adminref : { type : mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  projectId : { type : mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  org : { type : mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
}, { timestamps: true });

module.exports = mongoose.model('InviteToken', InviteTokenSchema);