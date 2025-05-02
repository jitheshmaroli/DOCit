import Stripe from 'stripe';
import { env } from '../../config/env';
import { ValidationError } from '../../utils/errors';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-03-31.basil',
    });
  }

  async createPaymentIntent(amount: number, paymentMethodId: string): Promise<string> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount, // In paisa
        currency: 'INR',
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never', // Disable redirect-based methods
        },
      });

      if (paymentIntent.status !== 'succeeded') {
        throw new ValidationError('Payment failed');
      }

      return paymentIntent.id;
    } catch (error: any) {
      throw new ValidationError(`Payment error: ${error.message}`);
    }
  }
}