import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Plan {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired' | 'Cancelled';
}

const SubscribedPlans = ({ patientId }: { patientId: string }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/patients/${patientId}/plans`,
          { withCredentials: true }
        );
        setPlans(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast.error('Failed to load plans', {
          position: 'bottom-right',
          autoClose: 3000,
        });
        setLoading(false);
      }
    };
    fetchPlans();
  }, [patientId]);

  if (loading) {
    return <div className="text-white">Loading plans...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <ToastContainer position="bottom-right" />
      <h2 className="text-lg font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
        Subscribed Plans
      </h2>
      {plans.length === 0 ? (
        <div className="text-gray-200">No plans subscribed.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="bg-white/10 border border-white/20 rounded-lg p-6 hover:bg-white/20 transition-all duration-300"
            >
              <h3 className="text-white font-medium text-lg">{plan.name}</h3>
              <p className="text-gray-200">
                Start Date: {new Date(plan.startDate).toLocaleDateString()}
              </p>
              <p className="text-gray-200">
                End Date: {new Date(plan.endDate).toLocaleDateString()}
              </p>
              <span
                className={`inline-block mt-2 px-2 py-1 rounded-full text-sm ${
                  plan.status === 'Active'
                    ? 'bg-green-500/20 text-green-300'
                    : plan.status === 'Expired'
                    ? 'bg-gray-500/20 text-gray-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {plan.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscribedPlans;