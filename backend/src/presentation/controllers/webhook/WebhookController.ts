import { Response } from 'express';
import { IPaymentService } from '../../../core/interfaces/services/IPaymentService';
import { ISubscriptionPlanUseCase } from '../../../core/interfaces/use-cases/ISubscriptionPlanUseCase';
import { CustomRequest } from '../../../types';
import { env } from '../../../config/env';
import logger from '../../../utils/logger';
import { ValidationError } from '../../../utils/errors';

export class WebhookController {
  constructor(
    private _stripeService: IPaymentService,
    private _subscriptionPlanUseCase: ISubscriptionPlanUseCase
  ) {}

  async handleStripeWebhook(req: CustomRequest, res: Response): Promise<void> {
    const payload = req.body;
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

    logger.debug(payload);
    logger.debug(req.headers);
    if (sig) logger.debug(sig);
    logger.debug(webhookSecret);
    if (!sig) {
      logger.warn('No Stripe signature provided');
      res.status(400).send('Webhook signature missing');
      return;
    }

    try {
      const event = this._stripeService.constructWebhookEvent(payload, sig, webhookSecret);

      await this._stripeService.processWebhookEvent(event, this._subscriptionPlanUseCase);

      logger.info(`Webhook processed successfully: ${event.type}`);
      res.status(200).json({ received: true });
    } catch (err: unknown) {
      const message = err instanceof ValidationError ? err.message : (err as Error).message || 'Unknown error';
      logger.error(`Webhook error: ${message}`, err);
      res.status(400).send(`Webhook Error: ${message}`);
    }
  }
}
