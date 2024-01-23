const express = require('express');
const tourController = require('./../controllers/tourController');

// create a new router. This is a middleware
const router = express.Router();
router
  .route('/') // not speifying the absolute route because tourRouter alreaady contains it
  .get(tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
