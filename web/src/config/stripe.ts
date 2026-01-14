import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key from environment variables
export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
);

// Consultation pricing
export const CONSULTATION_PRICE = 2500; // $25.00 in cents
export const CONSULTATION_DURATION = 15; // 15 minutes
