//This is the starting point.
const dotenv = require('dotenv');
dotenv.config({
  path: `${__dirname}/config.env`,
});
const app = require('./app');
//console.log(process.env);
//console.log(app.get('env'));
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
