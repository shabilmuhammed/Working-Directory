//This is the starting point.
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({
  path: `${__dirname}/config.env`,
});

const app = require('./app');

let DB = '';

// Update at the end of the course
if (process.version === 'v18.12.1') {
  DB = process.env.DATABASE_HRB.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD,
  );
} else {
  DB = process.env.DATABASE_PERSONAL.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD,
  );
}
mongoose
  .connect(DB, {
    //useNewUrlParser: true,
    // useFindAndModify: false,
    // useCreateIndex: true,
    //useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  });

// // Create new instance based out of the model
// const testTour = new Tour({
//   name: 'The Park  Camper',
//   price: 997,
// });

// // Save to database
// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('ERROR: ', err);
//   });

//console.log(process.env);
//console.log(app.get('env'));
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log('Node version', process.version);
  console.log(`Server running on port ${port}`);
});
