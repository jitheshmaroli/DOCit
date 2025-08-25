import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Stethoscope,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AppDispatch, RootState } from '../../../redux/store';
import {
  getPatientSubscriptionsThunk,
  cancelSubscriptionThunk,
  getPatientAppointmentsForDoctorThunk,
} from '../../../redux/thunks/patientThunk';
import { clearError } from '../../../redux/slices/patientSlice';
import { PatientSubscription, Appointment } from '../../../types/authTypes';
import DataTable, { Column } from '../../../components/common/DataTable';
import dayjs from 'dayjs';

interface ExtendedPatientSubscription extends PatientSubscription {
  plan: {
    _id: string;
    name: string;
    description: string;
    price: number;
    validityDays: number;
    appointmentCount: number;
    doctorId: string;
    doctorName?: string;
  };
  daysUntilExpiration: number;
  isExpired: boolean;
  expiryDate: string;
}

interface SubscriptionsProps {
  patientId: string;
}

const Subscriptions: React.FC<SubscriptionsProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const {
    activeSubscriptions,
    appointments,
    loading,
    error,
    lastRefundDetails,
  } = useSelector((state: RootState) => state.patient);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    dispatch(getPatientSubscriptionsThunk()).then((result) => {
      if (
        result.meta.requestStatus === 'fulfilled' &&
        Array.isArray(result.payload)
      ) {
        const doctorIds = (result.payload as ExtendedPatientSubscription[])
          .filter(
            (sub): sub is ExtendedPatientSubscription =>
              sub !== null &&
              sub !== undefined &&
              typeof sub === 'object' &&
              'plan' in sub &&
              sub.plan !== null &&
              typeof sub.plan === 'object' &&
              'doctorId' in sub.plan
          )
          .map((sub) => sub.plan.doctorId);
        const uniqueDoctorIds = [...new Set(doctorIds)];
        uniqueDoctorIds.forEach((doctorId) => {
          dispatch(getPatientAppointmentsForDoctorThunk({ doctorId }));
        });
      }
    });
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-500/20';
      case 'expired':
        return 'text-red-400 bg-red-500/20';
      case 'cancelled':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'expired':
        return <XCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const canCancelSubscription = (subscription: ExtendedPatientSubscription) => {
    if (subscription.status !== 'active') return false;
    if (subscription.appointmentsUsed > 0) return false;
    if (!subscription.createdAt) return false;
    const createdAt = dayjs(subscription.createdAt);
    const now = dayjs();
    const minutesSinceCreation = now.diff(createdAt, 'minute');
    return minutesSinceCreation <= 30;
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (window.confirm('Are you sure you want to cancel this subscription?')) {
      await dispatch(cancelSubscriptionThunk({ subscriptionId }));
    }
  };

  const canRenewSubscription = (status: string, subscriptionId: string) => {
    if (status !== 'expired') return false;
    return !activeSubscriptions.some(
      (sub) =>
        sub.status === 'active' &&
        sub._id !== subscriptionId &&
        sub.plan.doctorId ===
          activeSubscriptions.find((s) => s._id === subscriptionId)?.plan
            .doctorId
    );
  };

  const handlePrevCard = () => {
    setCurrentCardIndex((prev) =>
      prev === 0 ? filteredSubscriptions.length - 1 : prev - 1
    );
  };

  const handleNextCard = () => {
    setCurrentCardIndex((prev) =>
      prev === filteredSubscriptions.length - 1 ? 0 : prev + 1
    );
  };

  const filteredSubscriptions = activeSubscriptions.filter((sub) =>
    filterStatus === 'all' ? true : sub.status === filterStatus
  ) as ExtendedPatientSubscription[];

  const appointmentColumns: Column<Appointment>[] = [
    {
      header: 'Date',
      accessor: (appt) => new Date(appt.date).toLocaleDateString(),
    },
    {
      header: 'Time',
      accessor: (appt) => `${appt.startTime} - ${appt.endTime}`,
    },
    {
      header: 'Status',
      accessor: 'status',
      className: 'capitalize text-gray-200',
    },
    {
      header: 'Action',
      accessor: (appt) => (
        <button
          onClick={() => navigate(`/patient/appointment/${appt._id}`)}
          className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 text-sm font-medium"
        >
          View Details
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/20 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-white">My Subscriptions</h1>
          <p className="text-gray-200 mt-2">
            View and manage your healthcare subscriptions and appointment
            history
          </p>
        </div>

        {/* Filter Controls */}
        <div className="mb-6 flex justify-end">
          <select
            className="bg-white/20 backdrop-blur-lg border border-white/20 rounded-lg p-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all" className="bg-gray-800 text-gray-200">
              All Plans
            </option>
            <option value="active" className="bg-gray-800 text-gray-200">
              Active
            </option>
            <option value="expired" className="bg-gray-800 text-gray-200">
              Expired
            </option>
            <option value="cancelled" className="bg-gray-800 text-gray-200">
              Cancelled
            </option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 text-red-400 rounded-lg flex items-center gap-2 border border-red-400/20">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Success Message for Cancellation */}
        {lastRefundDetails && (
          <div className="mb-6 p-4 bg-green-500/20 text-green-400 rounded-lg flex items-center gap-2 border border-green-400/20">
            <CheckCircle className="w-5 h-5" />
            Subscription cancelled successfully. Refund ID:{' '}
            {lastRefundDetails.refundId}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/20 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-200 text-sm">Total Plans</p>
                <p className="text-2xl font-bold text-white">
                  {filteredSubscriptions.length}
                </p>
              </div>
              <Stethoscope className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-200 text-sm">Total Cost</p>
                <p className="text-2xl font-bold text-white">
                  ₹
                  {filteredSubscriptions
                    .reduce((sum, sub) => sum + (sub.plan?.price || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-200 text-sm">Appointments Left</p>
                <p className="text-2xl font-bold text-white">
                  {filteredSubscriptions
                    .filter((sub) => sub.status === 'active')
                    .reduce((sum, sub) => sum + (sub.appointmentsLeft || 0), 0)}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Subscription Carousel */}
        {filteredSubscriptions.length > 0 ? (
          <div className="relative mb-12">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevCard}
                className="p-2 bg-purple-500/20 text-purple-300 rounded-full hover:bg-purple-500/30 disabled:bg-gray-500/20 disabled:text-gray-400"
                disabled={filteredSubscriptions.length <= 1}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="text-gray-200">
                Plan {currentCardIndex + 1} of {filteredSubscriptions.length}
              </span>
              <button
                onClick={handleNextCard}
                className="p-2 bg-purple-500/20 text-purple-300 rounded-full hover:bg-purple-500/30 disabled:bg-gray-500/20 disabled:text-gray-400"
                disabled={filteredSubscriptions.length <= 1}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300"
                style={{ transform: `translateX(-${currentCardIndex * 100}%)` }}
              >
                {filteredSubscriptions.map((subscription) => (
                  <div
                    key={subscription._id}
                    className="w-full flex-shrink-0 bg-white/20 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl"
                  >
                    {/* Card Header */}
                    <div className="p-6 border-b border-white/20">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <User className="w-8 h-8 text-gray-200" />
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {subscription.plan?.doctorName ||
                                'Unknown Doctor'}
                            </h3>
                            <p className="text-gray-200 text-sm">
                              {subscription.status || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                            subscription.status
                          )}`}
                        >
                          {getStatusIcon(subscription.status)}
                          {subscription.status.charAt(0).toUpperCase() +
                            subscription.status.slice(1)}
                        </span>
                      </div>
                      <div className="mb-4">
                        <h4 className="text-xl font-bold text-white">
                          {subscription.plan?.name || 'N/A'}
                        </h4>
                        <p className="text-2xl font-bold text-purple-400">
                          ₹{subscription.plan?.price || 0}
                        </p>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6">
                      {/* Appointment Usage */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-200">
                            Appointments
                          </span>
                          <span className="text-sm text-gray-200">
                            {subscription.appointmentsLeft || 0}/
                            {subscription.plan?.appointmentCount || 0}
                          </span>
                        </div>
                        <div className="w-full bg-gray-500/20 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{
                              width: `${
                                subscription.plan?.appointmentCount
                                  ? (subscription.appointmentsLeft /
                                      subscription.plan.appointmentCount) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Plan Description */}
                      <div className="mb-6">
                        <h5 className="text-sm font-medium text-gray-200 mb-3">
                          Plan Description
                        </h5>
                        <p className="text-sm text-gray-300">
                          {subscription.plan?.description ||
                            'No description available'}
                        </p>
                      </div>

                      {/* Dates */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Started:{' '}
                            {subscription.createdAt
                              ? dayjs(subscription.createdAt).format(
                                  'MM/DD/YYYY'
                                )
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Clock className="w-4 h-4" />
                          <span>
                            {subscription.status === 'active' &&
                            subscription.daysUntilExpiration !== undefined
                              ? `Expires: ${dayjs().add(subscription.daysUntilExpiration, 'day').format('MM/DD/YYYY')}`
                              : subscription.expiryDate
                                ? `Expired: ${dayjs(subscription.expiryDate).format('MM/DD/YYYY')}`
                                : 'No expiry date'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {subscription.status === 'active' ? (
                          <>
                            <button
                              className="flex-1 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium"
                              onClick={() => navigate(`/patient/find-doctor`)}
                            >
                              Book Appointment
                            </button>
                            <button
                              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                canCancelSubscription(subscription)
                                  ? 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
                                  : 'bg-gray-700/20 text-gray-500 cursor-not-allowed'
                              }`}
                              onClick={() =>
                                handleCancelSubscription(subscription._id)
                              }
                              disabled={
                                !canCancelSubscription(subscription) || loading
                              }
                              title={
                                !canCancelSubscription(subscription)
                                  ? 'Cancellation only allowed within 30 minutes of subscription and if no appointments are used'
                                  : ''
                              }
                            >
                              Cancel Subscription
                            </button>
                          </>
                        ) : canRenewSubscription(
                            subscription.status,
                            subscription._id
                          ) ? (
                          <button
                            className="w-full bg-green-500/20 text-green-300 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
                            onClick={() => navigate(`/patient/find-doctor`)}
                          >
                            Renew Subscription
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-200 mt-6">
            No {filterStatus === 'all' ? '' : filterStatus} subscriptions found.
          </div>
        )}

        {/* Appointments Table */}
        {filteredSubscriptions.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-4">
              Appointments for{' '}
              {filteredSubscriptions[currentCardIndex]?.plan?.name ||
                'Selected Plan'}
            </h2>
            <div className="bg-white/20 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
              <DataTable
                data={
                  filteredSubscriptions[currentCardIndex]?.plan?.doctorId
                    ? appointments[
                        filteredSubscriptions[currentCardIndex].plan.doctorId
                      ] || []
                    : []
                }
                columns={appointmentColumns}
                isLoading={loading}
                error={error}
                emptyMessage="No appointments booked for this subscription."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscriptions;
