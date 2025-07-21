/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  createSubscriptionPlanThunk,
  getSubscriptionPlansThunk,
  updateSubscriptionPlanThunk,
  deleteSubscriptionPlanThunk,
  withdrawSubscriptionPlanThunk,
} from '../../redux/thunks/doctorThunk';
import { SubscriptionPlan } from '../../types/authTypes';

const DoctorPlans: React.FC = () => {
  const dispatch = useAppDispatch();
  const { plans = [], loading } = useAppSelector((state) => state.doctors);
  const { user } = useAppSelector((state) => state.auth);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planData, setPlanData] = useState({
    name: '',
    description: '',
    price: '',
    validityDays: '',
    appointmentCount: '',
  });

  useEffect(() => {
    if (user?.role === 'doctor') {
      dispatch(getSubscriptionPlansThunk());
    }
  }, [dispatch, user?.role]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setPlanData({ ...planData, [e.target.name]: e.target.value });
  };

  const handleSubmitPlan = async () => {
    if (
      !planData.name ||
      !planData.description ||
      !planData.price ||
      !planData.validityDays ||
      !planData.appointmentCount
    ) {
      toast.error('Please fill in all fields');
      return;
    }

    const price = parseInt(planData.price);
    const validityDays = parseInt(planData.validityDays);
    const appointmentCount = parseInt(planData.appointmentCount);

    if (price <= 0 || validityDays <= 0 || appointmentCount <= 0) {
      toast.error(
        'Price, validity days, and appointment count must be positive numbers'
      );
      return;
    }

    try {
      const payload = {
        name: planData.name,
        description: planData.description,
        price,
        validityDays,
        appointmentCount,
      };

      if (isEditMode && selectedPlanId) {
        await dispatch(
          updateSubscriptionPlanThunk({ id: selectedPlanId, ...payload })
        ).unwrap();
        toast.success('Plan updated successfully');
      } else {
        await dispatch(createSubscriptionPlanThunk(payload)).unwrap();
        toast.success('Plan created successfully');
      }

      setIsModalOpen(false);
      setIsEditMode(false);
      setSelectedPlanId(null);
      setPlanData({
        name: '',
        description: '',
        price: '',
        validityDays: '',
        appointmentCount: '',
      });
      dispatch(getSubscriptionPlansThunk());
    } catch (error: any) {
      const errorMessage =
        error?.message || (error as Error)?.message || error || 'Unknown error';
      console.log(error);
      toast.error(
        `Failed to ${isEditMode ? 'update' : 'create'} plan: ${errorMessage}`
      );
    }
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setIsEditMode(true);
    setSelectedPlanId(plan._id);
    setPlanData({
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price.toString(),
      validityDays: plan.validityDays.toString(),
      appointmentCount: plan.appointmentCount.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDeletePlan = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await dispatch(deleteSubscriptionPlanThunk(planId)).unwrap();
        toast.success('Plan deleted successfully');
        dispatch(getSubscriptionPlansThunk());
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          (error as Error)?.message ||
          error ||
          'Unknown error';
        toast.error(`Failed to delete plan: ${errorMessage}`);
      }
    }
  };

  const handleWithdrawPlan = async (planId: string) => {
    if (window.confirm('Are you sure you want to withdraw this plan?')) {
      try {
        await dispatch(withdrawSubscriptionPlanThunk(planId)).unwrap();
        toast.success('Plan withdrawn successfully');
        dispatch(getSubscriptionPlansThunk());
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to withdraw plan: ${errorMessage}`);
      }
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="bg-white/10 backdrop-blur-lg p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
            Subscription Plans
          </h2>
          <button
            onClick={() => {
              setIsEditMode(false);
              setPlanData({
                name: '',
                description: '',
                price: '',
                validityDays: '',
                appointmentCount: '',
              });
              setIsModalOpen(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            + Add Plan
          </button>
        </div>
        {loading ? (
          <div className="text-center text-gray-200">Loading plans...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.length > 0 ? (
              plans.map((plan) => (
                <div
                  key={plan._id}
                  className="bg-white/20 backdrop-blur-lg p-4 rounded-lg border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-white">
                    {plan.name || 'Unnamed Plan'}
                  </h3>
                  <p className="text-sm text-gray-200 mt-2">
                    {plan.description || 'No description'}
                  </p>
                  <p className="text-sm text-gray-200 mt-2">
                    Price: ₹{plan.price.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-200 mt-2">
                    Validity: {plan.validityDays} days
                  </p>
                  <p className="text-sm text-gray-200 mt-2">
                    Appointments: {plan.appointmentCount}
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
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan._id)}
                      className="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300"
                    >
                      Delete
                    </button>
                    {plan.status === 'pending' && (
                      <button
                        onClick={() => handleWithdrawPlan(plan._id)}
                        className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white px-3 py-1 rounded-lg hover:from-yellow-700 hover:to-yellow-800 transition-all duration-300"
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-200">
                No plans found. Add a new plan to get started.
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">
              {isEditMode ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-1">
                  Plan Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Enter plan name"
                  value={planData.name}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-white mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Enter plan description"
                  value={planData.description}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-white mb-1">
                  Price (in Rupees)
                </label>
                <input
                  id="price"
                  type="number"
                  name="price"
                  placeholder="Enter price in rupees"
                  value={planData.price}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <label htmlFor="validityDays" className="block text-sm font-medium text-white mb-1">
                  Validity (days)
                </label>
                <input
                  id="validityDays"
                  type="number"
                  name="validityDays"
                  placeholder="Enter validity in days"
                  value={planData.validityDays}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  min="1"
                  step="1"
                />
              </div>
              <div>
                <label htmlFor="appointmentCount" className="block text-sm font-medium text-white mb-1">
                  Number of Appointments
                </label>
                <input
                  id="appointmentCount"
                  type="number"
                  name="appointmentCount"
                  placeholder="Enter number of appointments"
                  value={planData.appointmentCount}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  min="1"
                  step="1"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditMode(false);
                  setSelectedPlanId(null);
                  setPlanData({
                    name: '',
                    description: '',
                    price: '',
                    validityDays: '',
                    appointmentCount: '',
                  });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPlan}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
              >
                {isEditMode ? 'Update' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DoctorPlans;