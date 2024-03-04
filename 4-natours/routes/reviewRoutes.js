const express = require('express');
const ReviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/') // not speifying the absolute route because reviewRouter alreaady contains it
  .get(ReviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    ReviewController.createReview,
  ); //checkbody will run first

module.exports = router;
