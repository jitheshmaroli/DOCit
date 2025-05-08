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

  async createPaymentIntent(amount: number): Promise<string> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount, 
        currency: 'INR',
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      });

      if (!paymentIntent.client_secret) {
        throw new ValidationError('Failed to create PaymentIntent');
      }

      return paymentIntent.client_secret;
    } catch (error: any) {
      throw new ValidationError(`PaymentIntent creation error: ${error.message}`);
    }
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<void> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new ValidationError('Payment not completed');
      }
    } catch (error: any) {
      throw new ValidationError(`Payment confirmation error: ${error.message}`);
    }
  }
}