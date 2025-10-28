import Stripe from 'stripe';
import { ISubscriptionPlanUseCase } from '../use-cases/ISubscriptionPlanUseCase';

export interface IPaymentService {
  createPaymentIntent(amount: number): Promise<string>;
  confirmPaymentIntent(paymentIntentId: string): Promise<void>;
  constructWebhookEvent(payload: Buffer | string, signature: string, webhookSecret: string): Stripe.Event;
  processWebhookEvent(event: Stripe.Event, subscriptionPlanUseCase: ISubscriptionPlanUseCase): Promise<void>;
}
