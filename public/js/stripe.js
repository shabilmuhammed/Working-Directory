/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51P9r7bSHO4wdFzaOFlhU9AMD7s3UCoLHmXkY2JEjdcdlKat7UIMYdGBdsdujrrLoNJoavRdCQOq2I67TjlXz3bUQ00M4Z5GLyN',
  );
  try {
    // 1) Get session from endpoint
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`,
    );
    window.location.assign(
      session.data.session.url,
    );
  } catch (err) {
    console.error(err);
    //showAlert('error', err.response.data.message);
  }
};
