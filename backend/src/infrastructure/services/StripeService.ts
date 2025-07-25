import Stripe from 'stripe';
import { env } from '../../config/env';
import { ValidationError } from '../../utils/errors';
import { IPaymentService } from '../../core/interfaces/services/IPaymentService';

// Extend the PaymentIntent interface to include charges
interface PaymentIntentWithCharges extends Stripe.PaymentIntent {
  charges?: {
    data: Stripe.Charge[];
  };
}

export class StripeService implements IPaymentService {
  private _stripe: Stripe;

  constructor() {
    this._stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
    });
  }

  async createPaymentIntent(amount: number): Promise<string> {
    try {
      const paymentIntent = await this._stripe.paymentIntents.create({
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
      const paymentIntent = await this._stripe.paymentIntents.retrieve(paymentIntentId);

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

  async createRefund(paymentIntentId: string): Promise<{ refundId: string; cardLast4?: string; amount: number }> {
    try {
      const refund = await this._stripe.refunds.create({
        payment_intent: paymentIntentId,
      });

      // Retrieve the PaymentIntent with expanded charges
      const paymentIntent = (await this._stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['charges'],
      })) as PaymentIntentWithCharges;

      let cardLast4: string | undefined = 'N/A';

      // Check if payment_method is available
      if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'string') {
        const paymentMethod = await this._stripe.paymentMethods.retrieve(paymentIntent.payment_method);
        if (paymentMethod.card) {
          cardLast4 = paymentMethod.card.last4 || 'N/A';
        }
      }
      // Fallback to charges if payment_method is not available
      else if (paymentIntent.charges && paymentIntent.charges.data.length > 0) {
        const charge = paymentIntent.charges.data[0];
        if (charge.payment_method_details?.card) {
          cardLast4 = charge.payment_method_details.card.last4 || 'N/A';
        }
      }

      return {
        refundId: refund.id,
        cardLast4,
        amount: refund.amount / 100, // Convert from cents to INR
      };
    } catch (error) {
      throw new ValidationError(`Failed to process refund: ${(error as Error).message || 'Unknown error'}`);
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this._stripe.paymentIntents.retrieve(paymentIntentId);
    } catch {
      throw new ValidationError('Failed to find refund details');
    }
  }
}
