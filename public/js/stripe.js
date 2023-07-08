/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';
const Stripe = require('stripe');

// Public API key of stripe
const stripe = Stripe(
  'pk_test_51NQ7oKSDrG14noDEwOj00D3wagOGMOqwCe80zmBmZsaxoLZOb6ajv7okZUL8oHwvCqRkj664O0d9RJ3Ispu6OHvS00NsqhG9U6'
);
export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from api endpoint
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);
    // 2) Create checkout session + charge credit card
    if (session) window.location.href = session.data.session.url;
  } catch (err) {
    showAlert('err', err);
  }
};
