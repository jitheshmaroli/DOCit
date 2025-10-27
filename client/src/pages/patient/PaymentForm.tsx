import React, { useState } from 'react';
import { useAppDispatch } from '../../redux/hooks';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import useAuth from '../../hooks/useAuth';
import { showSuccess } from '../../utils/toastConfig';
import { confirmSubscriptionThunk } from '../../redux/thunks/patientThunk';

interface PaymentDetails {
  paymentIntentId: string;
  amount: number;
}

interface PaymentFormProps {
  planId: string;
  price: number;
  onSuccess: (details: PaymentDetails) => void;
  onError: (error: string) => void;
  isResume?: boolean; // New optional prop
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  planId,
  price,
  onSuccess,
  onError,
  isResume = false, // Default false
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
      sessionStorage.setItem('planId', planId);

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?planId=${planId}`,
          payment_method_data: {
            billing_details: {
              address: {
                country: 'IN',
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
        await dispatch(
          confirmSubscriptionThunk({
            planId,
            paymentIntentId: paymentIntent.id,
          })
        ).unwrap();

        sessionStorage.removeItem('planId');

        const paymentDetails: PaymentDetails = {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100, // Convert from cents to INR
        };

        onSuccess(paymentDetails);
        showSuccess(
          isResume 
            ? 'Payment completed! Confirming subscription...' 
            : 'Payment successful! Subscribed to plan.'
        );
      } else {
        throw new Error('Payment not completed');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      onError(errorMessage);
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
                  country: 'never',
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
        {isProcessing ? 'Processing...' : 
         (isResume ? 'Complete Payment' : `Pay ₹${price.toFixed(2)}`)}
      </button>
    </form>
  );
};

export default PaymentForm;