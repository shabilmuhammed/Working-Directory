//This is the starting point.
const dotenv = require('dotenv');
const app = require('./app');
dotenv.config({
  path: `${__dirname}/config.env`,
});
console.log(process.env);
//console.log(app.get('env'));
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
