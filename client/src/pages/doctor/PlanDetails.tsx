import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  getPlanSubscriptionCountsThunk,
  getSubscribedPatientsThunk,
} from '../../redux/thunks/doctorThunk';
import { Patient, PatientSubscription } from '../../types/authTypes';
import DataTable, { Column } from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';

const ITEMS_PER_PAGE = 5;

const PlanDetails: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { plans, planSubscriptionCounts, loading } = useAppSelector(
    (state) => state.doctors
  );
  const [activeTab, setActiveTab] = useState<'details' | 'patients'>('details');
  const [subscribedPatients, setSubscribedPatients] = useState<Patient[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const plan = plans.find((p) => p._id === planId);

  useEffect(() => {
    if (planId) {
      dispatch(getPlanSubscriptionCountsThunk(planId));
      dispatch(getSubscribedPatientsThunk()).then((result) => {
        if (getSubscribedPatientsThunk.fulfilled.match(result)) {
          const patients = result.payload || [];
          setSubscribedPatients(patients);
          setTotalItems(patients.length || 0);
        }
      });
    }
  }, [dispatch, planId, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getSubscriptionForPlan = (
    patient: Patient,
    planId?: string
  ): PatientSubscription | undefined => {
    return patient.subscribedPlans?.find(
      (sub) => sub.planDetails?._id === planId
    );
  };

  const patientColumns: Column<Patient>[] = [
    {
      header: 'Name',
      accessor: (patient) => (
        <button
          onClick={() => navigate(`/doctor/patient/${patient._id}`)}
          className="hover:underline hover:text-blue-300 focus:outline-none"
        >
          {patient.name || 'N/A'}
        </button>
      ),
    },
    { header: 'Email', accessor: 'email' },
    {
      header: 'No. of Days Left',
      accessor: (patient) => {
        const subscription = getSubscriptionForPlan(patient, planId);
        return subscription?.remainingDays;
      },
    },
    {
      header: 'No. of Appointments Left',
      accessor: (patient) => {
        const subscription = getSubscriptionForPlan(patient, planId);
        return subscription?.appointmentsLeft ?? 'N/A';
      },
    },
    {
      header: 'Status',
      accessor: (patient) => {
        const subscription = getSubscriptionForPlan(patient, planId);
        return subscription ? (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              subscription.status === 'active'
                ? 'bg-green-500/20 text-green-300'
                : subscription.status === 'expired'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-yellow-500/20 text-yellow-300'
            }`}
          >
            {subscription.status.charAt(0).toUpperCase() +
              subscription.status.slice(1)}
          </span>
        ) : (
          'N/A'
        );
      },
    },
    {
      header: 'View Appointments',
      accessor: (patient) => (
        <button
          onClick={() =>
            navigate(`/doctor/patient/${patient._id}/appointments`)
          }
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
        >
          View
        </button>
      ),
    },
  ];

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Plan not found</h2>
          <button
            onClick={() => navigate('/doctor/plans')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
          >
            Back to Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8">
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl">
          <button
            onClick={() => navigate('/doctor/plans')}
            className="mb-4 text-white hover:text-blue-300 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Plans
          </button>
          <h2 className="text-xl sm:text-2xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
            Plan Details
          </h2>

          <div className="mb-6">
            <div className="flex border-b border-white/20">
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-b-2 border-purple-400 text-purple-300'
                    : 'text-gray-300 hover:text-purple-300'
                }`}
                onClick={() => setActiveTab('details')}
              >
                Plan Details
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'patients'
                    ? 'border-b-2 border-purple-400 text-purple-300'
                    : 'text-gray-300 hover:text-purple-300'
                }`}
                onClick={() => setActiveTab('patients')}
              >
                Subscribed Patients
              </button>
            </div>
          </div>

          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Plan Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                  <div>
                    <p className="text-sm text-gray-300">Name</p>
                    <p className="font-medium">{plan.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Price</p>
                    <p className="font-medium">₹{plan.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Validity</p>
                    <p className="font-medium">{plan.validityDays} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Appointments</p>
                    <p className="font-medium">{plan.appointmentCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Status</p>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        plan.status === 'approved'
                          ? 'bg-green-500/20 text-green-300'
                          : plan.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Subscriptions</p>
                    <p className="font-medium">
                      Active:{' '}
                      {(planId && planSubscriptionCounts[planId]?.active) || 0}
                      <br />
                      Expired:{' '}
                      {(planId && planSubscriptionCounts[planId]?.expired) || 0}
                      <br />
                      Cancelled:{' '}
                      {(planId && planSubscriptionCounts[planId]?.cancelled) ||
                        0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="space-y-6">
              <DataTable
                data={subscribedPatients}
                columns={patientColumns}
                isLoading={loading}
                emptyMessage="No subscribed patients found."
              />
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  className="mt-6"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanDetails;
