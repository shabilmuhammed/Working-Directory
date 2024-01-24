const express = require('express');
const tourController = require('./../controllers/tourController');

// create a new router. This is a middleware
const router = express.Router();

router.param('id', tourController.checkID); //Parameter middleware

router
  .route('/') // not speifying the absolute route because tourRouter alreaady contains it
  .get(tourController.getAllTours)
  .post(
    tourController.checkBody,
    tourController.createTour
  ); //checkbody will run first

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
