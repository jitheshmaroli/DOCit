import { raw, Router } from 'express';
import createControllers from '../../infrastructure/di/controllers';

const router = Router();

// Controllers
const { webhookController } = createControllers();

// Stripe webhook (no auth needed)
router.use('/stripe', raw({ type: 'application/json' }));
router.post('/stripe', webhookController.handleStripeWebhook.bind(webhookController));

export default router;
