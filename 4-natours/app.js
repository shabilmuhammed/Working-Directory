//Standard to have all the express code in app.js
const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();
// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.static(`${__dirname}/public`));
app.use(express.json()); //middleware. used to add body to request object
// middleware has access to request and response
// next() sends it to the next middleware function. Very important
// middleware should be called before the router
// app.use((req, res, next) => {
//   console.log('Hello from the middleware');
//   next();
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 2) ROUTE HANDLERS

// 3) ROUTES

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// // only updates elements that have changed
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

//Written in a better way

// this will mount the routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// HANDLE UNKNOWN ROUTES
// all CATERS TO ALL REQUESTS GET,POST ETC....
app.all('*', (req, res, next) => {
  // const err = new Error(
  //   `Route ${req.originalUrl} not found`,
  // );
  // err.status = 'fail';
  // err.statusCode = 404;
  next(
    new AppError(
      `Route ${req.originalUrl} not found`,
      404,
    ),
  ); //EXPRESS WILL KNOW THIS IS A ERROR. SKIPS ALL OTHER MIDDLEWARE
});

app.use(globalErrorHandler);

module.exports = app;
