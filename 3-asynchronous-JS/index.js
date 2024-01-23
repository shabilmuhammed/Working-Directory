const fs = require('fs');
const superagent = require('superagent');

const readFilePro = (file) => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, data) => {
      if (err) reject('File not found');
      resolve(data);
    });
  });
};

const writeFilePro = (file, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, (err) => {
      if (err) reject('Could not write file');
      resolve('Success');
    });
  });
};

/// ASYNC AWAIT //////////////////////////////////////////////////////////////////////////
// Asynchronous function. Runs in the background
const getDogpic = async () => {
  try {
    const data = await readFilePro(`${__dirname}/dog.txt`); //Returns a promise
    console.log(`Breed: ${data}`);

    const res1 = superagent.get(
      `https://dog.ceo/api/breed/${data}/images/random`
    );
    const res2 = superagent.get(
      `https://dog.ceo/api/breed/${data}/images/random`
    );
    const res3 = superagent.get(
      `https://dog.ceo/api/breed/${data}/images/random`
    );

    const all = await Promise.all([res1, res2, res3]); // waits for all promises parallely
    const imgs = all.map((el) => el.body.message);

    await writeFilePro(`${__dirname}/dog-img.txt`, imgs.join('\n'));

    console.log('Dog image saved successfully');
  } catch (err) {
    console.log(err);
    throw err;
  }
  return '2: Ready';
};

// Creates a function and calls it immediately
(async () => {
  try {
    console.log('1: Will get dog pics!');
    const x = await getDogpic();
    console.log(x);
    console.log('3: Done getting dog pics!');
  } catch (err) {
    console.log('Dog not found!');
  }
})();

/*
console.log('1: Will get dog pics!');
getDogpic()
  .then((x) => {
    console.log(x);
    console.log('3: Done getting dog pics!');
  })
  .catch((err) => {
    console.log('Dog not found!');
  });
*/
///// PROMISE //////////////////////////////////
/*
readFilePro(`${__dirname}/dog.txt`)
  .then((data) => {
    // Returns a promise. Use then after promise
    console.log(`Breed: ${data}`);
    // Promise returns back a value that we expect to receive at a later time
    return superagent.get(`https://dog.ceo/api/breed/${data}/images/random`); //Returns a promise
  })
  .then((res) => {
    console.log(res.body.message);

    return writeFilePro('dog-img.txt', res.body.message); //Returns a promise
  })
  .then(() => {
    console.log('Dog image saved successfully');
  })
  .catch((err) => {
    console.log(err);
  });

// fs.readFile(`${__dirname}/dog.txt`, (err, data) => {
//   console.log(`Breed: ${data}`);

//   superagent
//     .get(`https://dog.ceo/api/breed/${data}/images/random`)
//     .end((err, res) => {
//       if (err) return console.log(err.message);
//       console.log(res.body.message);

//       fs.writeFile('dog-img.txt', res.body.message, (err) => {
//         console.log('Dog image saved successfully');
//       });
//     });
// });
*/
