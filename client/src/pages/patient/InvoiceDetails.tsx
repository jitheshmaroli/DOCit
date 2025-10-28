import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchInvoiceDetails } from '../../services/patientService';

interface InvoiceDetails {
  paymentIntentId: string;
  amount: number;
  cardLast4?: string;
  date: string;
  planName?: string;
  doctorName?: string;
  status: string;
}

const InvoiceDetails: React.FC = () => {
  const { paymentIntentId } = useParams<{ paymentIntentId: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (paymentIntentId) {
      fetchInvoiceDetails(paymentIntentId)
        .then((data) => {
          setInvoice(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [paymentIntentId]);

  if (loading) {
    return (
      <div className="text-white text-center py-8">Loading invoice...</div>
    );
  }

  if (!invoice) {
    return <div className="text-white text-center py-8">Invoice not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">
            Invoice Details
          </h2>
          <div className="text-gray-200 space-y-4">
            <p>
              <strong>Payment ID:</strong> {invoice.paymentIntentId}
            </p>
            <p>
              <strong>Amount:</strong> ₹{invoice.amount.toFixed(2)}
            </p>
            <p>
              <strong>Card Last 4 Digits:</strong> {invoice.cardLast4 || 'N/A'}
            </p>
            <p>
              <strong>Date:</strong>{' '}
              {new Date(invoice.date).toLocaleDateString()}
            </p>
            <p>
              <strong>Plan:</strong> {invoice.planName || 'N/A'}
            </p>
            <p>
              <strong>Doctor:</strong> {invoice.doctorName || 'N/A'}
            </p>
            <p>
              <strong>Status:</strong> {invoice.status}
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
