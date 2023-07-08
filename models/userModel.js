const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name.'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please enter your email.'],
    trim: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email.'],
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'lead-guide', 'guide'],
    default: 'user',
  },
  photo: { type: String, default: 'default.jpg' },
  password: {
    type: String,
    required: [true, 'A password is required'],
    minlength: 8,
    select: false, //will not show up in reponse
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same.',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// ENCRYPTING THE PASSWORD WITH BECRYPTJS PACKAGE BEFORE SAVING IT IN DB
userSchema.pre('save', async function (next) {
  //RUN THIS ONLY IF PASSWORD WAS MODIFIED
  if (!this.isModified('password')) return next();

  //HASH THE PASSWORD WITH BCRYPT
  this.password = await bcrypt.hash(this.password, 12);

  //DELETE CONFIRMPASSWORD FIELD .... WILL NOT PERSIST/SHOW IN DB
  this.passwordConfirm = undefined;

  next();
});

// UPDATE THE PASSWORDCHANGEAT PROPERTY OF THE USER
userSchema.pre('save', function (next) {
  //IF THE PASSWORD IS MODIFIED OR THE DOCUMENT IS NEWLY CREATED
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // delaying it 1sec to avoid time delay in updating db and jwt issue
  next();
});

// FILTER THE QUERY TO SHOW ONLY ACTIVE USERS IN GET ALL USERS ROUTE
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword, //PASSWORD COMING FROM THE USER
  userPassword //ORIGINAL HASHED PASSWORD STORED IN THE DB
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// CHECK IF USER CHANGED THE PASSWORD AFTER THE TOKEN WAS ISSUED
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

// CREATE A RANDOM TOKEN FOR RESETING THE PASSWORD
userSchema.methods.createPasswordResetToken = function () {
  // create random reset token using built in crypto module
  const resetToken = crypto.randomBytes(32).toString('hex');

  // encrypting the resetToken
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  // setting the token expires limit to 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // returning the original reset token (unecrypted that is to be sent to user's email)
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
