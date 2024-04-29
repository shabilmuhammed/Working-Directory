const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

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

const createSendToken = (
  user,
  statusCode,
  res,
) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() +
        process.env.JWT_COOKIE_EXPIRES_IN *
          24 *
          60 *
          60 *
          1000,
    ),
    secure: false,
    httpOnly: true,
  };

  // SET SECURE (HTTPS) ONLY WHEN WE ARE IN PRODUCTION
  if (process.env.NODE_ENV === 'production')
    cookieOptions.secure = true;

  // SET COOKIE
  res.cookie('jwt', token, cookieOptions);

  // REMOVES PASSWORD FROM OUTPUT
  user.password = undefined;

  // JWT TOKEN IS PART OF THE RESPONSE
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
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
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();
    // CREATES A JWT TOKEN TO SIGN IN THE USER
    createSendToken(newUser, 201, res);
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
    createSendToken(user, 200, res);
  },
);

exports.logout = (rqq, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

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
    } else if (
      req.cookies.jwt &&
      req.cookies.jwt !== 'loggedout'
    ) {
      token = req.cookies.jwt;
    }
    if (!token) {
      res.redirect('/');
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
    res.locals.user = freshUser;
    next();
  },
);

// Only for rendered pages, no errors
exports.isLoggedIn = async (req, res, next) => {
  // 1) GETTING TOKEN AND CHECK IF IT'S EXIST
  try {
    let token;
    if (req.cookies.jwt) {
      token = req.cookies.jwt;

      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET,
      );

      // 3) CHECK IF USER STILL EXIST

      const freshUser = await User.findById(
        decoded.id,
      );
      if (!freshUser) {
        return next();
      }

      // 4) CHECK IF USER CHANGED PASSWORD AFTER THE TOKEN WAS ISSUED

      if (
        freshUser.changedPasswordAfter(
          decoded.iat,
        )
      ) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      // res.locals will pass the value to the templates
      res.locals.user = freshUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};
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
    // 1) GET USER BASED ON POSTED EMAIL
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

    try {
      const resetURL = `${req.protocol}://${req.get('host')}/api/v1/resetPassword/${resetToken}`;
      await new Email(
        user,
        resetURL,
      ).sendPasswordReset();

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

exports.resetPassword = catchAsync(
  async (req, res, next) => {
    // 1) Get user based on the token

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // 2) if token has not expired, and there is user, set the new password
    if (!user) {
      return next(
        new AppError(
          'Password reset token is invalid or has expired',
          400,
        ),
      );
    }
    user.password = req.body.password;
    user.passwordConfirm =
      req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // 3) updated changedPasswordAt property for the user

    // 4) log the user in, send JWT
    createSendToken(user, 200, res);
  },
);

exports.updatePassword = catchAsync(
  async (req, res, next) => {
    // 1) GET USER FROM COLLECTION
    const user = await User.findById(
      req.user.id,
    ).select('+password');

    if (!user) {
      return next(
        new AppError('User not found', 404),
      );
    }
    // 2) CHECK IF POSTED CURRENT PASSWORD IS CORRECT

    if (
      !(await user.correctPassword(
        req.body.passwordCurrent,
        user.password,
      ))
    ) {
      return next(
        new AppError('Incorrect password', 401),
      );
    }

    // 3) UPDATE THE PASSWORD

    user.password = req.body.password;
    user.passwordConfirm =
      req.body.passwordConfirm;
    await user.save();

    // 4) LOG USER IN, SEND JWT
    createSendToken(user, 200, res);
  },
);
