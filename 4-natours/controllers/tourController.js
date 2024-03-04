const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Name and price are required',
//     });
//   }
//   next();
// };

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields =
    'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = catchAsync(
  async (req, res, next) => {
    // //BUILD QUERY
    // const queryObj = { ...req.query }; // deconstructs and creates a query object
    // const excludedFields = [
    //   'page',
    //   'sort',
    //   'limit',
    //   'fields',
    // ];
    // excludedFields.forEach(
    //   (el) => delete queryObj[el],
    // );
    // // ADVANCED FILTERTING
    // //{ difficulty: 'easy', duration: { gte: '5' }, sort: '1' }
    // // we need to replace gte with $gte
    // let queryString = JSON.stringify(queryObj);
    // queryString = queryString.replace(
    //   /\b(gte|gt|lte|lt)\b/g,
    //   (match) => `$${match}`,
    // );

    // //const tours = await Tour.find(queryObj);
    // //Tour.find will return a query. await will return the final document that is the result set.
    // // after await we cant then use sort or pagination to the result

    // let query = Tour.find(
    //   JSON.parse(queryString),
    // );

    //SORTING

    // if (req.query.sort) {
    //   const sortBy = req.query.sort
    //     .split(',')
    //     .join(' ');
    //   // sort (price ratingsAverage)
    //   query = query.sort(sortBy);
    // } else {
    //   query = query.sort('-ratingsAverage');
    // }

    // FIELD LIMITING
    // select (price difficulty)
    // comma needs to replaced by a space
    // if (req.query.fields) {
    //   const fields = req.query.fields
    //     .split(',')
    //     .join(' ');
    //   query = query.select(fields);
    // } else {
    //   query = query.select('-__v');
    //   // __v will not be returned. prefixing with -
    // }

    // PAGINATION
    // page=3&limit=10 means user has requested page of 3 and limit of 10
    // 1-10 -> page 1
    // 11-20 -> page 2
    // 21-30 -> page 3. We need to skip 20 records to reach page 3. hence skip = (page - 1) * limit
    // const page = req.query.page * 1 || 1; // || 1 defaults to 1
    // const limit = req.query.limit * 1 || 100;
    // const skip = (page - 1) * limit;
    // query = query.skip(skip).limit(limit);

    // if (req.query.page) {
    //   const numTours =
    //     await Tour.countDocuments();
    //   if (skip >= numTours)
    //     throw new Error(
    //       'This page does not exist',
    //     );
    // }

    //EXECUTE QUERY
    const features = new APIFeatures(
      Tour.find(),
      req.query,
    )
      .filter()
      .sort()
      .limitFields()
      .pagination();
    const tours = await features.query;

    // const tours = await Tour.find()
    //   .where('duration')
    //   .equals(5);

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  },
);

exports.getTour = catchAsync(
  async (req, res, next) => {
    //const tour = tours.find(el => el.id === req.params.id)
    const tour = await Tour.findById(
      req.params.id,
      // Tour.findOne({_id: req.params.id})
    ).populate('reviews'); // guides is a referenced field. this will fill the actual data in the output
    if (!tour) {
      return next(
        new AppError(
          `Tour with id ${req.params.id} not found`,
          404,
        ),
      );
    }
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  },
);

exports.createTour = catchAsync(
  // CONSIDER catchAsync as a try-catch function
  async (req, res, next) => {
    const newTour = await Tour.create(req.body);
    //console.log(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  },
);

exports.updateTour = catchAsync(
  async (req, res, next) => {
    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true, // will return the new document
        runValidators: true, // will run the validators
      },
    );
    if (!tour) {
      return next(
        new AppError(
          `Tour with id ${req.params.id} not found`,
          404,
        ),
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  },
);

exports.deleteTour = catchAsync(
  async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(
      req.params.id,
    );

    if (!tour) {
      return next(
        new AppError(
          `Tour with id ${req.params.id} not found`,
          404,
        ),
      );
    }

    res.status(204).json({
      status: 'success',
      message: 'Tour deleted',
    });
  },
);

// AGGREGATION PIPELINE
exports.getTourStats = catchAsync(
  async (req, res, next) => {
    const stats = await Tour.aggregate([
      {
        // STAGE 1: find all tours with ratings >= 4.5
        $match: {
          ratingsAverage: { $gte: 4.5 },
        },
      },
      {
        // STAGE 2: group tours and do aggregation
        $group: {
          _id: { $toUpper: '$difficulty' }, // group by difficulty
          numRatings: {
            $sum: '$ratingsQuantity',
          },
          numTours: { $sum: 1 },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        // STAGE 3: sort by average price
        $sort: {
          avgPrice: 1,
        },
      },
      // {
      //   $match: {
      //     _id: { $ne: 'EASY' },
      //   },
      // },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  },
);

exports.getMonthlyPlan = catchAsync(
  async (req, res, next) => {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates', // splits document into different elements based on startDate
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' }, // push creates an arrary
        },
      },
      {
        $addFields: {
          month: '$_id',
        },
      },
      {
        $project: {
          _id: 0, // 0 will omit
          month: 1, // 1 wil project
          numTourStarts: 1,
          tours: 1,
        },
      },
      {
        $sort: {
          numTourStarts: -1,
        },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  },
);
