const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

// create a new router. This is a middleware
const router = express.Router();

//router.param('id', tourController.checkID); //Parameter middleware

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
  .get(tourController.getMonthlyPlan);

router
  .route('/') // not speifying the absolute route because tourRouter alreaady contains it
  .get(
    authController.protect,
    tourController.getAllTours,
  )
  .post(tourController.createTour); //checkbody will run first

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo(
      'admin',
      'lead-guide',
    ),
    tourController.deleteTour,
  );

module.exports = router;
