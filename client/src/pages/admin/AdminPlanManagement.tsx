import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  getAllPlansThunk,
  approvePlanThunk,
  rejectPlanThunk,
  deletePlanThunk,
} from '../../redux/thunks/adminThunk';
import { SubscriptionPlan } from '../../types/authTypes';

const AdminPlanManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { plans = [], loading, error } = useAppSelector((state) => state.admin);
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      dispatch(getAllPlansThunk());
    }
  }, [dispatch, user?.role]);

  const handleApprovePlan = async (planId: string) => {
    try {
      await dispatch(approvePlanThunk(planId)).unwrap();
      toast.success('Plan approved successfully');
    } catch (error) {
      toast.error(`Failed to approve plan: ${error}`);
    }
  };

  const handleRejectPlan = async (planId: string) => {
    try {
      await dispatch(rejectPlanThunk(planId)).unwrap();
      toast.success('Plan rejected successfully');
    } catch (error) {
      toast.error(`Failed to reject plan: ${error}`);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await dispatch(deletePlanThunk(planId)).unwrap();
        toast.success('Plan deleted successfully');
      } catch (error) {
        toast.error(`Failed to delete plan: ${error}`);
      }
    }
  };

  const filteredPlans = Array.isArray(plans)
    ? plans.filter((plan): plan is NonNullable<SubscriptionPlan> => {
        if (!plan || !plan._id || !plan.name) {
          console.warn('Invalid plan:', plan);
          return false;
        }
        return (
          plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plan.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          !searchTerm
        );
      })
    : [];

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
          onClick={() => dispatch(getAllPlansThunk())}
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
        <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
          Plan Management
        </h2>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by plan name or doctor..."
            className="w-full md:w-1/3 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white/20 backdrop-blur-lg border border-white/20 rounded-lg">
            <thead>
              <tr className="bg-white/10 border-b border-white/20">
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {filteredPlans.length > 0 ? (
                filteredPlans.map((plan) => (
                  <tr
                    key={plan._id}
                    className="hover:bg-white/30 transition-all duration-300"
                  >
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">
                      {plan.name}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {plan.doctorName || plan.doctorId || 'N/A'}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      ${plan.appointmentCost}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {plan.duration} days
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          plan.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : plan.status === 'approved'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {plan.status}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {plan.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprovePlan(plan._id)}
                            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-1 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectPlan(plan._id)}
                            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeletePlan(plan._id)}
                        className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-3 py-1 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 md:px-6 py-4 text-center text-gray-200"
                  >
                    No plans found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default AdminPlanManagement;