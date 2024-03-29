const Tour = require('../models/tourModel');
const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getOverview = catchAsync(
  async (req, res, next) => {
    // 1) Get tour data from collection
    const tours = await Tour.find();

    // 2) Build template

    // 3) Render template using tour data
    res.status(200).render('overview', {
      title: 'All Tours',
      tours,
    });
  },
);

exports.getTour = catchAsync(
  async (req, res, next) => {
    // 1) Get the data for the requested tour (including reviews and guides)
    const slug = req.params.slug;
    const tour = await Tour.findOne({
      slug: slug,
    }).populate({
      path: 'reviews',
      fields: 'review rating user',
    });

    // 2) Build template

    //3) Render template
    res.status(200).render('tour', {
      title: tour.name,
      tour,
    });
  },
);

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};
