const mongoose = require('mongoose');
const slugify = require('slugify');

// Create mongodb model
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [
        true,
        'A tour must have a duration',
      ],
    },
    maxGroupSize: {
      type: Number,
      required: [
        true,
        'A tour must have a group size',
      ],
    },
    difficulty: {
      type: String,
      required: [
        true,
        'A tour must have a difficulty',
      ],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [
        true,
        ' A tour must have a price',
      ],
    },
    priceDiscount: Number,
    summary: {
      type: String,
      trim: true,
      required: [
        true,
        'A tour must have a summary',
      ],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [
        true,
        'A tour must have a cover image',
      ],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourSchema
  .virtual('durationWeeks') // virtual properties are derived and not stored in the database. They can't be queried
  .get(function () {
    return this.duration / 7; // this will point to the current document
  });

// DOCUMENT MIDDLEWARE. RUNS BEFORE .save() AND .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); // this POINTS TO THE CURRENTLY POINTED DOCUMENT
  next();
});

//POST GETS EXECUTED AFTER PRE IS DONE. NO this BECAUSE THE DOCUMENT IS ALREADY PROCESSED
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });
// Create a mongodb object
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
