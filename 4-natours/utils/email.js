const nodemailer = require('nodemailer');
const catchAsync = require('./catchAsync');

const sendEmail = catchAsync(async (options) => {
  // 1) CREATE A TRANSPORTER
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      type: 'login',
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
  //2) DEFINE EMAIL OPTIONS
  const mailOptions = {
    from: 'Muhammed Shabil <admin@shabiltours.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  // 3) SEND EMAIL
  await transporter.sendMail(mailOptions);
});

module.exports = sendEmail;
