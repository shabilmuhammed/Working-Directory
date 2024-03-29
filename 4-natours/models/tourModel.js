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
      maxlength: [
        40,
        'A tour name must be at most 40 characters',
      ],
      minlength: [
        10,
        'A tour name must be at least 10 characters',
      ],
      // validate: [
      //   validator.isAlpha,
      //   'Tour name must only contain alpha characters',
      // ],  EXTERNAL LIBRARY validator
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
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message:
          'Difficulty must be either "easy", "medium" or "difficult"',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
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
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this ONLY POINTS TO CURRENT DOC ON NEW DOC CREATION. UPDATES DONT WORK
          return val < this.price; // DISCOUNT SHOULD ALWAYS BE LESS THAN THE PRICE
        },
        message:
          'Discount price ({VALUE}) must be less than price',
      },
    },
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
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJson
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    // This enables virtual propoerties to show up in the output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//tourSchema.index({ price: 1 }); //  1 sorts ascending
tourSchema.index({
  price: 1,
  ratingsAverage: -1,
});
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); // index for geopspatial

tourSchema
  .virtual('durationWeeks') // virtual properties are derived and not stored in the database. They can't be queried
  .get(function () {
    return this.duration / 7; // this will point to the current document
  });

// CHILD REFERNCING
// Virtual populate is used to populate fields that are not referenced in the model but present in the the child.
// For example, Review model contains Tour reference but Tour model does not have any children for Review.
// In this case, ForeignField indicates the field that is used in the Review model to point to the tour collection
// Local field is the _id of the tour that is present in the Review model to establish the link
tourSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'tour',
});

// DOCUMENT MIDDLEWARE. RUNS BEFORE .save() AND .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); // this POINTS TO THE CURRENTLY POINTED DOCUMENT
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(
//     async (id) => await User.findById(id),
//   ); // This will return an array of promises

//   this.guides = await Promise.all(guidesPromises); // This will return an array of promise values
//   next();
// });
//POST GETS EXECUTED AFTER PRE IS DONE. NO this BECAUSE THE DOCUMENT IS ALREADY PROCESSED
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE. RUNS BEFORE .find() AND.findOne()
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.startTime = Date.now();
  next();
});

// Populates the referenced objects in the output
// Example guides in Tour
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(
    `Query took: ${Date.now() - this.startTime} milliseconds.`,
  );
  next();
});

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({
//     // this REFERES TO THE CURRENT AGGREGATION OBJECT
//     $match: { secretTour: { $ne: true } }, //ADDS A NEW STAGE TO THE STARTING OF THE ARRAY BEFORE REST OF THE AGGREGATION
//   });
//   next();
// });

// Create a mongodb object
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
