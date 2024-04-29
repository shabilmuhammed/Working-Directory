//This is the starting point.
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');
dotenv.config({
  path: './config.env',
});

const tours = JSON.parse(
  fs.readFileSync(
    `${__dirname}/tours.json`,
    'utf-8',
  ),
);

const users = JSON.parse(
  fs.readFileSync(
    `${__dirname}/users.json`,
    'utf-8',
  ),
);

const reviews = JSON.parse(
  fs.readFileSync(
    `${__dirname}/reviews.json`,
    'utf-8',
  ),
);

// IMPORT DATA

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, {
      validateBeforeSave: false,
    });
    await Review.create(reviews);
    console.log('Data imported');
    process.exit();
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETA DATA FROM DB
const deleteData = async () => {
  try {
    await Tour.deleteMany({});
    await Review.deleteMany({});
    await User.deleteMany({});
    console.log('Data deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

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

if (process.argv[2] === '--import') {
  importData();
}

if (process.argv[2] === '--delete') {
  deleteData();
}

mongoose.connect(DB).then(() => {
  console.log('Connected to MongoDB');
});
