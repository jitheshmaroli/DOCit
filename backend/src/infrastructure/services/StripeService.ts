import Stripe from 'stripe';
import { env } from '../../config/env';
import { ValidationError } from '../../utils/errors';
import { IPaymentService } from '../../core/interfaces/services/IPaymentService';

export class StripeService implements IPaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
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
    } catch (error: unknown) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new ValidationError(`PaymentIntent creation error: ${error.message}`);
      }
      throw new ValidationError(
        `Unexpected error during PaymentIntent creation: ${(error as Error).message || 'Unknown error'}`
      );
    }
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<void> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new ValidationError('Payment not completed');
      }
    } catch (error: unknown) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new ValidationError(`Payment confirmation error: ${error.message}`);
      }
      throw new ValidationError(
        `Unexpected error during payment confirmation: ${(error as Error).message || 'Unknown error'}`
      );
    }
  }
}
