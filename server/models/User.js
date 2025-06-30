const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require("bcrypt");

const UserSchema = mongoose.Schema({
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    firstname : { type : String, trim: true, minlength: 2 },
    lastname : { type : String, trim: true,  },
    email : {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: validator.isEmail,
            message: 'Please provide a valid email address'
        }
    },
    phone : { type : String, trim: true},
    password : { type : String, required: true, minlength: 6 },
    role : { type: String, enum: ['admin', 'manager', 'user'], default : 'user' },
    adminRef : { type : mongoose.Schema.Types.ObjectId, ref: 'User', default: null},
    projects: { type: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Project' } ], default: [] },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null }
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

UserSchema.methods.comparePasswords = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
}

UserSchema.methods.incrementFailedLogin = async function () {
  this.failedLoginAttempts += 1;

  // Lock for 15 minutes after 5 failed attempts
  if (this.failedLoginAttempts >= 5) {
    this.lockUntil = Date.now() + 15 * 60 * 1000; // 15 mins
  }

  await this.save();
};

UserSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

module.exports = mongoose.model("User", UserSchema);