const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

// eslint-disable-next-line arrow-body-style
const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
  );
};

exports.signup = catchAsync(
  async (req, res, next) => {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt:
        req.body.passwordChangedAt,
      role: req.body.role,
    });

    // CREATES A JWT TOKEN TO SIGN IN THE USER
    const token = signToken(newUser._id);

    // JWT TOKEN IS PART OF THE RESPONSE
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser,
      },
    });
  },
);

exports.login = catchAsync(
  async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist

    if (!email || !password) {
      return next(
        new AppError(
          'Please provide email and password',
          400,
        ),
      );
    }

    // 2) Check if user exists && password is correct

    const user = await User.findOne({
      email,
    }).select(
      '+password', // Password is not part of select by default
    );

    if (
      !user ||
      !(await user.correctPassword(
        password,
        user.password,
      ))
    ) {
      return next(
        new AppError(
          'Incorrect email or password',
          401,
        ),
      );
    }

    //3) If everything is ok, send token to client
    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
    });
  },
);

exports.protect = catchAsync(
  async (req, res, next) => {
    // 1) GETTING TOKEN AND CHECK IF IT'S EXIST
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith(
        'Bearer',
      )
    ) {
      token =
        req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return next(
        new AppError(
          'You are not logged in',
          401,
        ),
      );
    }
    // 2) VERIFICATION TOKEN

    const decoded = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET,
    );

    // 3) CHECK IF USER STILL EXIST

    const freshUser = await User.findById(
      decoded.id,
    );
    if (!freshUser) {
      return next(
        new AppError('User not found', 401),
      );
    }

    // 4) CHECK IF USER CHANGED PASSWORD AFTER THE TOKEN WAS ISSUED

    if (
      freshUser.changedPasswordAfter(decoded.iat)
    ) {
      return next(
        new AppError(
          'User changed password. Please login again',
        ),
        401,
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = freshUser;
    next();
  },
);

// eslint-disable-next-line arrow-body-style
exports.restrictTo = (...roles) => {
  // (...roles) is used when you have an unspecified number of param values that might come in. can be user,admin or both
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You are not authorized to perform this action',
          403,
        ),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(
  async (req, res, next) => {
    // 1) GET USER BASED ON POSTed EMAIL
    const user = await User.findOne({
      email: req.body.email,
    });

    if (!user) {
      return next(
        new AppError(
          'No user found with that email',
          404,
        ),
      );
    }

    //2) GENERATE THE RANDOM RESET TOKEN

    const resetToken =
      user.createPasswordResetToken();

    // WHEN THE RESETPASSWORD EXPIRES IS SET, THE DOCUMENT IS NOT REALLY SAVED HENCE,
    await user.save({
      validateBeforeSave: false,
    });

    //3) SEND EMAIL TO USER WITH RESET TOKEN
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request to reset your password with your new password and confirm password to ${resetURL}. \n Ignore if you didnt forget your password`;

    try {
      await sendEmail({
        message,
        email: user.email,
        subject:
          'Your password reset token(valid for 10 mins)',
      });
      res.status(200).json({
        status: 'success',
        message: 'Token sent to email',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({
        validateBeforeSave: false,
      });

      return next(
        new AppError(
          'There was an error sending the email',
        ),
        501,
      );
    }
  },
);

exports.resetPassword = (req, res, next) => {};
