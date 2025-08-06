import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Calendar,
  Clock,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Stethoscope,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AppDispatch, RootState } from '../../../redux/store';
import {
  getPatientSubscriptionsThunk,
  cancelSubscriptionThunk,
  getPatientAppointmentsForDoctorThunk,
} from '../../../redux/thunks/patientThunk';
import { clearError } from '../../../redux/slices/patientSlice';
import {
  Doctor,
  PatientSubscription,
} from '../../../types/authTypes';

// Extend PatientSubscription to include transformed properties
interface ExtendedPatientSubscription extends PatientSubscription {
  plan: {
    _id: string;
    name: string;
    description: string;
    price: number;
    validityDays: number;
    appointmentCount: number;
    doctorId: string;
  };
  daysUntilExpiration: number;
  isExpired: boolean;
  expiryDate: string;
}

interface SubscriptionsProps {
  patientId: string;
}

const Subscriptions: React.FC<SubscriptionsProps> = ({ patientId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    activeSubscriptions,
    loading,
    error,
    lastRefundDetails,
    appointments,
  } = useSelector((state: RootState) => state.patient);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedSubscriptions, setExpandedSubscriptions] = useState<string[]>(
    []
  );

  useEffect(() => {
    dispatch(getPatientSubscriptionsThunk());
    return () => {
      dispatch(clearError());
    };
  }, [dispatch, patientId]);

  useEffect(() => {
    // Fetch appointments for each doctor associated with subscriptions
    const doctorIds = Object.values(activeSubscriptions)
      .filter(
        (sub): sub is ExtendedPatientSubscription =>
          sub !== null && 'plan' in sub
      )
      .map((sub) => sub.plan.doctorId);
    doctorIds.forEach((doctorId) => {
      dispatch(getPatientAppointmentsForDoctorThunk({ doctorId }));
    });
  }, [dispatch, activeSubscriptions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'expired':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
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

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (window.confirm('Are you sure you want to cancel this subscription?')) {
      await dispatch(cancelSubscriptionThunk({ subscriptionId }));
    }
  };

  const canRenewSubscription = (status: string) => {
    if (status !== 'expired') return false;
    return !Object.values(activeSubscriptions).some(
      (sub): sub is ExtendedPatientSubscription =>
        sub !== null &&
        'plan' in sub &&
        sub.status === 'active'
    );
  };

  const toggleExpandSubscription = (subscriptionId: string) => {
    setExpandedSubscriptions((prev) =>
      prev.includes(subscriptionId)
        ? prev.filter((id) => id !== subscriptionId)
        : [...prev, subscriptionId]
    );
  };

  const subscriptions = Object.values(activeSubscriptions).filter(
    (sub): sub is ExtendedPatientSubscription =>
      sub !== null &&
      'plan' in sub &&
      sub.plan !== null &&
      'daysUntilExpiration' in sub &&
      'isExpired' in sub &&
      'expiryDate' in sub
  );

  const filteredSubscriptions = subscriptions.filter((sub) =>
    filterStatus === 'all' ? true : sub.status === filterStatus
  );

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Subscriptions</h1>
          <p className="text-gray-600 mt-2">
            View and manage your healthcare subscriptions and appointment
            history
          </p>
        </div>

        {/* Filter Controls */}
        <div className="mb-6 flex justify-end">
          <select
            className="bg-white border border-gray-300 rounded-lg p-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Plans</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Success Message for Cancellation */}
        {lastRefundDetails && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Subscription cancelled successfully. Refund ID:{' '}
            {lastRefundDetails.refundId}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Plans</p>
                <p className="text-2xl font-bold text-gray-800">
                  {subscriptions.length}
                </p>
              </div>
              <Stethoscope className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Cost</p>
                <p className="text-2xl font-bold text-gray-800">
                  ₹
                  {subscriptions
                    .reduce((sum, sub) => sum + (sub.plan?.price || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Appointments Left</p>
                <p className="text-2xl font-bold text-gray-800">
                  {subscriptions
                    .filter((sub) => sub.status === 'active')
                    .reduce((sum, sub) => sum + (sub.appointmentsLeft || 0), 0)}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Subscription Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSubscriptions.map((subscription) => {
            const doctor = subscription.plan as unknown as Doctor;
            const relatedAppointments = appointments.filter(
              (appt) => appt.doctorId._id === subscription.plan.doctorId
            );

            return (
              <div
                key={subscription._id}
                className="bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <User className="w-8 h-8 text-gray-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {doctor.name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {doctor.speciality?.join(', ') || 'N/A'}
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
                    <h4 className="text-xl font-bold text-gray-800">
                      {subscription.plan?.name || 'N/A'}
                    </h4>
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{subscription.plan?.price || 0}
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {/* Appointment Usage */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        Appointments
                      </span>
                      <span className="text-sm text-gray-600">
                        {subscription.appointmentsLeft || 0}/
                        {subscription.plan?.appointmentCount || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
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
                    <h5 className="text-sm font-medium text-gray-600 mb-3">
                      Plan Description
                    </h5>
                    <p className="text-sm text-gray-500">
                      {subscription.plan?.description ||
                        'No description available'}
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Started:{' '}
                        {subscription.createdAt
                          ? new Date(
                              subscription.createdAt
                            ).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>
                        {subscription.status === 'active' &&
                        subscription.expiryDate
                          ? `Expires: ${new Date(subscription.expiryDate).toLocaleDateString()}`
                          : subscription.expiryDate
                            ? `Expired: ${new Date(subscription.expiryDate).toLocaleDateString()}`
                            : 'No expiry date'}
                      </span>
                    </div>
                  </div>

                  {/* Appointment History */}
                  <div className="mb-6">
                    <button
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
                      onClick={() => toggleExpandSubscription(subscription._id)}
                    >
                      {expandedSubscriptions.includes(subscription._id) ? (
                        <>
                          <ChevronUp className="w-4 h-4" /> Hide Appointment
                          History
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" /> Show Appointment
                          History
                        </>
                      )}
                    </button>
                    {expandedSubscriptions.includes(subscription._id) && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-600 mb-3">
                          Appointment History
                        </h5>
                        {relatedAppointments.length > 0 ? (
                          <ul className="space-y-3">
                            {relatedAppointments.map((appt) => (
                              <li
                                key={appt._id}
                                className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600"
                              >
                                <div className="flex justify-between">
                                  <span>
                                    {new Date(appt.date).toLocaleDateString()}{' '}
                                    at {appt.startTime}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs ${getStatusColor(appt.status)}`}
                                  >
                                    {appt.status.charAt(0).toUpperCase() +
                                      appt.status.slice(1)}
                                  </span>
                                </div>
                                {appt.cancellationReason && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Reason: {appt.cancellationReason}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No appointments booked for this subscription.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {subscription.status === 'active' ? (
                      <>
                        <button
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          onClick={() => {
                            // Navigate to booking page
                          }}
                        >
                          Book Appointment
                        </button>
                        <button
                          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                          onClick={() =>
                            handleCancelSubscription(subscription._id)
                          }
                          disabled={loading}
                        >
                          Cancel Subscription
                        </button>
                      </>
                    ) : canRenewSubscription(
                        subscription.status,
                      ) ? (
                      <button
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        onClick={() => {
                          // Navigate to subscription page for renewal
                        }}
                      >
                        Renew Subscription
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredSubscriptions.length === 0 && (
          <div className="text-center text-gray-600 mt-6">
            No {filterStatus === 'all' ? '' : filterStatus} subscriptions found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscriptions;
