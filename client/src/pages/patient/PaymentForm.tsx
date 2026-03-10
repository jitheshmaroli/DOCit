import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import useAuth from '../../hooks/useAuth';
import { Loader2, Lock, CreditCard } from 'lucide-react';

interface PaymentDetails {
  paymentIntentId: string;
  amount: number;
}

interface PaymentFormProps {
  planId: string;
  price: number;
  onSuccess: (details: PaymentDetails) => void;
  onError: (error: string) => void;
  isResume?: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  planId,
  price,
  onSuccess,
  onError,
  isResume = false,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || !user) {
      onError('Stripe, elements, or user not initialized');
      return;
    }
    setIsProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?planId=${planId}`,
          payment_method_data: {
            billing_details: { address: { country: 'IN' } },
          },
        },
        redirect: 'if_required',
      });
      if (error)
        throw new Error(error.message || 'Payment confirmation failed');
      if (paymentIntent?.status === 'succeeded') {
        onSuccess({
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
        });
      } else {
        throw new Error('Payment not completed');
      }
    } catch (error: unknown) {
      onError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Amount summary */}
      <div className="flex items-center justify-between p-3.5 bg-primary-50 border border-primary-100 rounded-xl">
        <div className="flex items-center gap-2 text-primary-700">
          <CreditCard size={16} />
          <span className="text-sm font-semibold">
            {isResume ? 'Complete Payment' : 'Amount Due'}
          </span>
        </div>
        <span className="text-xl font-bold text-primary-700">
          ₹{price.toFixed(2)}
        </span>
      </div>

      {/* Stripe element */}
      <div className="rounded-xl border border-surface-border bg-white p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'upi', 'netbanking'],
            fields: { billingDetails: { address: { country: 'never' } } },
            wallets: { applePay: 'auto', googlePay: 'auto' },
          }}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={!stripe || isProcessing}
        className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Processing...
          </>
        ) : (
          <>
            <Lock size={15} />{' '}
            {isResume ? 'Complete Payment' : `Pay ₹${price.toFixed(2)}`}
          </>
        )}
      </button>

      <p className="text-xs text-text-muted text-center flex items-center justify-center gap-1">
        <Lock size={10} /> Secured by Stripe. Your card details are never
        stored.
      </p>
    </div>
  );
};

export default PaymentForm;
