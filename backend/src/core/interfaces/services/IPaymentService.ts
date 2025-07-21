export interface IPaymentService {
  createPaymentIntent(amount: number): Promise<string>;
  confirmPaymentIntent(paymentIntentId: string): Promise<void>;
}
