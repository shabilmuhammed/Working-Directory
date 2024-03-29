const express = require('express');
const ReviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({
  mergeParams: true, // Allows params from other routes. Example tourId
});

router.use(authController.protect); // All routes below will have protect

router
  .route('/') // not speifying the absolute route because reviewRouter alreaady contains it
  .get(ReviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    ReviewController.setTourUserIds,
    ReviewController.createReview,
  ); //checkbody will run first

router
  .route('/:id')
  .get(ReviewController.getReview)
  .delete(
    authController.restrictTo('user', 'admin'),
    ReviewController.deleteReview,
  )
  .patch(
    authController.restrictTo('user', 'admin'),
    ReviewController.updateReview,
  );

module.exports = router;
