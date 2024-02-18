const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [
      true,
      'Please provide your email address',
    ],
    unique: true,
    lowercase: true,
    validate: [
      validator.isEmail,
      'Please provide a valid email address',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [
      true,
      'Please confirm your password',
    ],
    validate: {
      // This only works on CREATE or SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords do not match',
    },
  },
  role: {
    type: String,
    enum: [
      'user',
      'guide',
      'lead-guide',
      'admin',
    ],
    default: 'user',
  },
  photo: {
    type: String,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre('save', async function (next) {
  // Only run this function is password is modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(
    this.password,
    12,
  );

  // Deletes the confirmed password once hashing is complete
  this.passwordConfirm = undefined;
  next();
});

//INSTANCE METHOD. AVAILABLE FOR ALL DOCUMENTS
userSchema.methods.correctPassword =
  async function (
    candidatePassword,
    userPassword,
  ) {
    return await bcrypt.compare(
      candidatePassword,
      userPassword,
    );
  };

userSchema.methods.changedPasswordAfter =
  function (JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10,
      );
      return JWTTimestamp < changedTimestamp; // IF token timestamp is less than changedtimestamp then password has been changed. User must login again
    }
    // False means not changed
    return false;
  };

userSchema.methods.createPasswordResetToken =
  function () {
    const resetToken = crypto
      .randomBytes(32)
      .toString('hex');

    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    console.log(
      { resetToken },
      this.passwordResetToken,
    );

    this.passwordResetExpires =
      Date.now() + 10 * 60 * 1000; // 10 mins

    return resetToken;
  };

// Create a mongodb object
const User = mongoose.model('User', userSchema);

module.exports = User;
