import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  createSubscriptionPlan,
  getSubscriptionPlans,
} from '../../redux/thunks/doctorThunk'; // Assume thunks for plans

const DoctorPlans: React.FC = () => {
  const dispatch = useAppDispatch();
  const { plans = [], loading, error } = useAppSelector((state) => state.doctors);
  const { user } = useAppSelector((state) => state.auth);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planData, setPlanData] = useState({
    title: '',
    description: '',
    price: '',
    duration: '',
  });

  useEffect(() => {
    if (user?.role === 'doctor') {
      dispatch(getSubscriptionPlans());
    }
  }, [dispatch, user?.role]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setPlanData({ ...planData, [e.target.name]: e.target.value });
  };

  const handleSubmitPlan = async () => {
    if (
      !planData.title ||
      !planData.description ||
      !planData.price ||
      !planData.duration
    ) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await dispatch(
        createSubscriptionPlan({
          title: planData.title,
          description: planData.description,
          price: parseFloat(planData.price),
          duration: parseInt(planData.duration),
        })
      ).unwrap();
      toast.success('Plan created successfully');
      setIsModalOpen(false);
      setPlanData({ title: '', description: '', price: '', duration: '' });
      dispatch(getSubscriptionPlans());
    } catch (error) {
      toast.error(`Failed to create plan: ${error}`);
    }
  };

  if (loading && (!plans || plans.length === 0)) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-300"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border-l-4 border-red-500 p-4 rounded-lg text-white">
        <p className="text-sm">Error: {error}</p>
        <button
          onClick={() => dispatch(getSubscriptionPlans())}
          className="mt-2 text-sm text-purple-300 hover:text-purple-200 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="bg-white/10 backdrop-blur-lg p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
            Subscription Plans
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            + Add Plan
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.length > 0 ? (
            plans.map((plan) => (
              <div
                key={plan._id}
                className="bg-white/20 backdrop-blur-lg p-4 rounded-lg border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-white">{plan.title}</h3>
                <p className="text-sm text-gray-200 mt-2">{plan.description}</p>
                <p className="text-sm text-gray-200 mt-2">
                  ${plan.price} for {plan.duration} days
                </p>
                <p
                  className={`text-xs mt-2 inline-flex px-2 py-1 rounded-full ${
                    plan.status === 'approved'
                      ? 'bg-green-500/20 text-green-300'
                      : plan.status === 'pending'
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {plan.status}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-200">
              No plans found. Add a new plan to get started.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Add Subscription Plan</h2>
            <div className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Plan Title"
                value={planData.title}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <textarea
                name="description"
                placeholder="Description"
                value={planData.description}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <input
                type="number"
                name="price"
                placeholder="Price ($)"
                value={planData.price}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <input
                type="number"
                name="duration"
                placeholder="Duration (days)"
                value={planData.duration}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPlan}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DoctorPlans;