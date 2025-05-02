import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch } from '../../redux/hooks';
import { subscribeToPlanThunk } from '../../redux/thunks/doctorThunk';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
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
      onError('Stripe or user not initialized');
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { paymentMethod, error: paymentMethodError } =
        await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            address: {
              country: 'IN',
            },
          },
        });

      if (paymentMethodError) {
        throw new Error(
          paymentMethodError.message || 'Failed to create payment method'
        );
      }

      await dispatch(
        subscribeToPlanThunk({
          planId,
          paymentMethodId: paymentMethod.id,
        })
      ).unwrap();

      onSuccess();
      toast.success('Payment successful! Subscribed to plan.');
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
        <CardElement
          options={{
            style: {
              base: {
                color: '#fff',
                fontSize: '16px',
                '::placeholder': { color: '#a0aec0' },
              },
              invalid: { color: '#e53e3e' },
            },
            hidePostalCode: true,
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
