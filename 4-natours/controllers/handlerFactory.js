const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(
      req.params.id,
    );

    if (!doc) {
      return next(
        new AppError(
          `No document with id ${req.params.id} found`,
          404,
        ),
      );
    }

    res.status(204).json({
      status: 'success',
      message: 'Document deleted',
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true, // will return the new document
        runValidators: true, // will run the validators
      },
    );
    if (!doc) {
      return next(
        new AppError(
          `Document with id ${req.params.id} not found`,
          404,
        ),
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(
    // CONSIDER catchAsync as a try-catch function
    async (req, res, next) => {
      const doc = await Model.create(req.body);
      //console.log(req.body);
      res.status(201).json({
        status: 'success',
        data: {
          data: doc,
        },
      });
    },
  );

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) {
      query = query.populate(popOptions);
    }

    const doc = await query; // guides is a referenced field. this will fill the actual data in the output

    if (!doc) {
      return next(
        new AppError(
          `doc with id ${req.params.id} not found`,
          404,
        ),
      );
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on Tour
    let filter = {};
    if (req.params.tourId)
      filter = { tour: req.params.tourId }; // Tour id is passed through nested routes. Redirect method
    //EXECUTE QUERY
    const features = new APIFeatures(
      Model.find(filter),
      req.query,
    )
      .filter()
      .sort()
      .limitFields()
      .pagination();
    const doc = await features.query; //.explain(); this will add statistics

    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        doc,
      },
    });
  });
