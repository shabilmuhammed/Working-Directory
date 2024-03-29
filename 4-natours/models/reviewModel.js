const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [
        true,
        'A review cannot be empty',
      ],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [
        true,
        'A review must belong to a tour',
      ],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [
        true,
        'A review must belong to a user',
      ],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index(
  {
    tour: 1,
    user: 1,
  },
  {
    unique: true,
  },
);

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: 'tour',
  //     select: 'name',
  //   }).populate({
  //     path: 'user',
  //     select: 'name photo',
  //   });
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calcAverageRatings =
  async function (tourId) {
    const stats = await this.aggregate([
      {
        $match: { tour: tourId },
      },
      {
        $group: {
          _id: '$tour',
          nRating: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);
    if (stats.length > 0) {
      await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating,
      });
    } else {
      // Default
      await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: 0,
        ratingsAverage: 4.5,
      });
    }
  };

reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});

// This middleware will find the current document and store it in the variable
// used to update avgRatings when review gets updated or deleted
// findByIdandUpdate & findByIdandDelete do not have the current document (this keyword)
reviewSchema.pre(
  /^findOneAnd/,
  async function (next) {
    this.r = await this.clone().findOne();
    next();
  },
);

reviewSchema.post(
  /^findOneAnd/,
  async function (next) {
    // this.r = await this.clone().findOne(); wont work, The query has already been executed
    await this.r.constructor.calcAverageRatings(
      this.r.tour,
    );
  },
);

// Create a mongodb object
const Review = mongoose.model(
  'Review',
  reviewSchema,
);

module.exports = Review;
