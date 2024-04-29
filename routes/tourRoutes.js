const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

// create a new router. This is a middleware
const router = express.Router();

//router.param('id', tourController.checkID); //Parameter middleware

// POST /tour/232fdasfag/reviews
// GET /tour/232fdasfag/reviews

router.use('/:tourId/reviews', reviewRouter); // redirect route to reviews

router
  .route('/top-5-cheap')
  .get(
    tourController.aliasTopTours,
    tourController.getAllTours,
  );

router
  .route('/tour-stats')
  .get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo(
      'admin',
      'lead-guide',
      'guide',
    ),
    tourController.getMonthlyPlan,
  );

router
  .route(
    '/tours-within/:distance/center/:latlng/unit/:unit',
  )
  .get(tourController.getToursWithin);

router
  .route('/distances/:latlng/unit/:unit')
  .get(tourController.getDistances);

router
  .route('/') // not speifying the absolute route because tourRouter alreaady contains it
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo(
      'admin',
      'lead-guide',
    ),
    tourController.createTour,
  ); //checkbody will run first

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo(
      'admin',
      'lead-guide',
    ),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo(
      'admin',
      'lead-guide',
    ),
    tourController.deleteTour,
  );

module.exports = router;
