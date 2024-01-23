const fs = require('fs');

const tours = JSON.parse(
  fs.readFileSync(
    `${__dirname}/../dev-data/data/tours-simple.json`
  )
);

exports.getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours,
    },
  });
};

exports.getTour = (req, res) => {
  console.log(req.params);

  const id = req.params.id * 1; // when multiplied, returns a number instead of a string
  const tour = tours.find((el) => el.id === id);

  // if (id > tours.length) {
  if (!tour) {
    return res.status(404).json({
      status: 'error',
      message: 'Tour not found',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
};

exports.createTour = (req, res) => {
  //console.log(req.body);
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign(
    { id: newId },
    req.body
  );
  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
};

exports.updateTour = (req, res) => {
  const id = req.params.id * 1; // when multiplied, returns a number instead of a string
  const index = tours.findIndex(
    (el) => el.id === id
  );

  if (!index) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  let resultTours = [...tours]; // copies tours to resultTours. nothing fancy
  resultTours[index] = Object.assign(
    resultTours[index],
    req.body
  );

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(resultTours),
    (err) => {
      if (err) console.log(err);
      res.status(200).json({
        status: 'success',
        data: {
          tour: resultTours[index],
        },
      });
    }
  );
};

exports.deleteTour = (req, res) => {
  const id = req.params.id * 1; // when multiplied, returns a number instead of a string
  const index = tours.findIndex(
    (el) => el.id === id
  );

  if (index === -1) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  deleteTours = [...tours];

  deleteTours.splice(index, 1);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(deleteTours),
    (err) => {
      res.status(204).json({
        status: 'success',
        message: 'Tour deleted',
      });
    }
  );
};
