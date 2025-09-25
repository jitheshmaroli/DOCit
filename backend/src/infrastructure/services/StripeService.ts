import Stripe from 'stripe';
import { env } from '../../config/env';
import { ValidationError } from '../../utils/errors';
import { IPaymentService } from '../../core/interfaces/services/IPaymentService';
import logger from '../../utils/logger';

interface PaymentIntentWithCharges extends Stripe.PaymentIntent {
  charges?: {
    data: Stripe.Charge[];
  };
}

interface StripeRequestOptions extends Stripe.RequestOptions {
  expand?: string[];
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
    } catch (error) {
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
    } catch (error) {
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

      logger.debug(JSON.stringify(refund, null, 2));

      const refundRetrieve = await this._stripe.refunds.retrieve(refund.id);
      logger.debug(JSON.stringify(refundRetrieve, null, 2));

      // Retrieve the PaymentIntent with expanded charges
      const paymentIntent = (await this._stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['charges'],
      })) as PaymentIntentWithCharges;

      logger.debug(JSON.stringify(paymentIntent, null, 2));

      let cardLast4: string | undefined = 'N/A';

      // Check if payment_method is available
      if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'string') {
        const paymentMethod = await this._stripe.paymentMethods.retrieve(paymentIntent.payment_method);
        logger.debug(JSON.stringify(paymentMethod, null, 2));
        if (paymentMethod.card) {
          cardLast4 = paymentMethod.card.last4 || 'N/A';
        }
      } else if (paymentIntent.charges?.data?.length) {
        const charge = paymentIntent.charges.data[0];
        if (charge.payment_method_details?.card) {
          cardLast4 = charge.payment_method_details.card.last4 || 'N/A';
        }
      }

      return {
        refundId: refund.id,
        cardLast4,
        amount: refund.amount / 100,
      };
    } catch (error) {
      throw new ValidationError(`Failed to process refund: ${(error as Error).message || 'Unknown error'}`);
    }
  }

  async retrievePaymentIntent(paymentIntentId: string, options?: StripeRequestOptions): Promise<Stripe.PaymentIntent> {
    try {
      return await this._stripe.paymentIntents.retrieve(paymentIntentId, options);
    } catch (error) {
      throw new ValidationError(`Failed to find payment intent: ${(error as Error).message || 'Unknown error'}`);
    }
  }

  async paymentMethodsRetrieve(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      return await this._stripe.paymentMethods.retrieve(paymentMethodId);
    } catch (error) {
      throw new ValidationError(`Failed to retrieve payment method: ${(error as Error).message || 'Unknown error'}`);
    }
  }
}
