// F:\DOCit\backend\src\presentation\controllers\webhook\WebhookController.ts (removed unused next, fixed imports)
import { Response } from 'express';
import { IPaymentService } from '../../../core/interfaces/services/IPaymentService';
import { ISubscriptionPlanUseCase } from '../../../core/interfaces/use-cases/ISubscriptionPlanUseCase';
import { CustomRequest } from '../../../types';
import { env } from '../../../config/env';
import logger from '../../../utils/logger';
import { ValidationError } from '../../../utils/errors';
// import Stripe from 'stripe';

export class WebhookController {
  constructor(
    private _stripeService: IPaymentService,
    private _subscriptionPlanUseCase: ISubscriptionPlanUseCase
  ) {}

  // F:\DOCit\backend\src\presentation\controllers\webhook\WebhookController.ts
  // ... (imports and constructor unchanged)

  async handleStripeWebhook(req: CustomRequest, res: Response): Promise<void> {
    const payload = req.body; // Raw via express.raw
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

    logger.debug(payload); // Keep for debugging
    logger.debug(req.headers); // Keep
    if (sig) logger.debug(sig); // Keep
    logger.debug(webhookSecret); // Keep

    if (!sig) {
      logger.warn('No Stripe signature provided');
      res.status(400).send('Webhook signature missing');
      return;
    }

    try {
      //   let event: Stripe.Event;
      //   if (env.NODE_ENV === 'development') {
      //     // DEV BYPASS: Skip sig verification for CLI/local testing (remove in prod)
      //     logger.warn('DEV BYPASS: Skipping signature verification for development');
      //     const bodyStr = typeof payload === 'string' ? payload : payload.toString('utf8');
      //     event = JSON.parse(bodyStr) as Stripe.Event;
      //   } else {
      // Production: Full verification
      const event = this._stripeService.constructWebhookEvent(payload, sig, webhookSecret);
      //   }

      // Process event
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
