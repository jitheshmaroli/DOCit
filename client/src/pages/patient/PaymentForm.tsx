import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch } from '../../redux/hooks';
import { confirmSubscriptionThunk } from '../../redux/thunks/doctorThunk';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import useAuth from '../../hooks/useAuth';

interface PaymentFormProps {
  planId: string;
  price: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  planId,
  price,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useAppDispatch();
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
      // Store for redirect handling
      sessionStorage.setItem('planId', planId);

      // Confirm the payment with PaymentElement
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?planId=${planId}`,
          payment_method_data: {
            billing_details: {
              address: {
                country: 'IN', // Hardcode country as India
              },
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        throw new Error(error.message || 'Payment confirmation failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm subscription on the backend
        await dispatch(
          confirmSubscriptionThunk({
            planId,
            paymentIntentId: paymentIntent.id,
          })
        ).unwrap();

        // Clear session storage
        sessionStorage.removeItem('planId');

        onSuccess();
        toast.success('Payment successful! Subscribed to plan.');
      } else {
        throw new Error('Payment not completed');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      onError(errorMessage);
      toast.error(`Payment failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white/10 p-4 rounded-lg border border-white/20">
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'upi', 'netbanking'],
            fields: {
              billingDetails: {
                address: {
                  country: 'never', // Avoid collecting country in UI
                },
              },
            },
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
            },
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-2 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-300 disabled:opacity-50"
      >
        {isProcessing ? 'Processing...' : `Pay ₹${(price / 100).toFixed(2)}`}
      </button>
    </form>
  );
};

export default PaymentForm;