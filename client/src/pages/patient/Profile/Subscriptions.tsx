import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dayjs from 'dayjs';
import { useAppSelector } from '../../../redux/hooks';

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

const Subscriptions: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const {
    activeSubscriptions,
    appointments,
    loading,
    error,
    lastRefundDetails,
  } = useSelector((state: RootState) => state.patient);
  const { user } = useAppSelector((state: RootState) => state.auth);
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
        return 'text-green-400 bg-green-500/20 border-green-400/30';
      case 'expired':
        return 'text-red-400 bg-red-500/20 border-red-400/30';
      case 'cancelled':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5" />;
      case 'expired':
        return <XCircle className="w-5 h-5" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
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
    toast(
      ({ closeToast }) => (
        <div className="flex flex-col gap-4">
          <p className="text-white">
            Are you sure you want to cancel this subscription?
          </p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  await dispatch(cancelSubscriptionThunk({ subscriptionId }));
                  toast.success('Subscription cancelled successfully!', {
                    position: 'bottom-right',
                    autoClose: 3000,
                    className:
                      'bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg',
                  });
                } catch {
                  toast.error('Failed to cancel subscription', {
                    position: 'bottom-right',
                    autoClose: 3000,
                    className:
                      'bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg',
                  });
                }
                closeToast();
              }}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300"
            >
              Yes
            </button>
            <button
              onClick={closeToast}
              className="bg-white/10 text-white px-4 py-2 rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              No
            </button>
          </div>
        </div>
      ),
      {
        position: 'bottom-right',
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        className:
          'bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg',
      }
    );
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
      className: 'text-gray-200',
    },
    {
      header: 'Time',
      accessor: (appt) => `${appt.startTime} - ${appt.endTime}`,
      className: 'text-gray-200',
    },
    {
      header: 'Status',
      accessor: 'status',
      className: 'capitalize text-gray-200',
    },
    {
      header: 'Action',
      accessor: (appt) => (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/patient/appointment/${appt._id}`)}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 text-sm font-medium shadow-md"
        >
          View Details
        </motion.button>
      ),
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 flex items-center justify-center text-gray-200">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8 px-4 sm:px-6 lg:px-8">
      <ToastContainer position="bottom-right" theme="dark" />
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/10 backdrop-blur-lg py-10 rounded-2xl border border-white/20 mb-8 text-center"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
            Your Subscription Plans
          </h1>
          <p className="mt-2 text-gray-300 text-lg">
            Manage your doctor subscriptions and appointments
          </p>
        </motion.div>

        {/* Filter Controls */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 flex justify-end"
        >
          <select
            className="w-full md:w-48 p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none shadow-md"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1.25rem',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <option value="all" className="bg-gray-800 text-white">
              All Plans
            </option>
            <option value="active" className="bg-gray-800 text-white">
              Active
            </option>
            <option value="expired" className="bg-gray-800 text-white">
              Expired
            </option>
            <option value="cancelled" className="bg-gray-800 text-white">
              Cancelled
            </option>
          </select>
        </motion.div>

        {/* Error and Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-500/20 text-red-400 rounded-lg flex items-center gap-2 border border-red-400/30 shadow-lg"
            >
              <AlertCircle className="w-5 h-5" />
              {error}
            </motion.div>
          )}
          {lastRefundDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-green-500/20 text-green-400 rounded-lg flex items-center gap-2 border border-green-400/30 shadow-lg"
            >
              <CheckCircle className="w-5 h-5" />
              Subscription cancelled successfully. Refund ID:{' '}
              {lastRefundDetails.refundId}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {[
            {
              title: 'Total Plans',
              value: filteredSubscriptions.length,
              icon: <Stethoscope className="w-8 h-8 text-purple-400" />,
            },
            {
              title: 'Total Cost',
              value: `₹${filteredSubscriptions.reduce((sum, sub) => sum + (sub.plan?.price || 0), 0).toFixed(2)}`,
              icon: <CreditCard className="w-8 h-8 text-purple-400" />,
            },
            {
              title: 'Appointments Left',
              value: filteredSubscriptions
                .filter((sub) => sub.status === 'active')
                .reduce((sum, sub) => sum + (sub.appointmentsLeft || 0), 0),
              icon: <Calendar className="w-8 h-8 text-purple-400" />,
            },
          ].map((card, index) => (
            <motion.div
              key={card.title}
              whileHover={{
                scale: 1.03,
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
              }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                </div>
                {card.icon}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Subscription Carousel */}
        {filteredSubscriptions.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="relative mb-12 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePrevCard}
                className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                disabled={filteredSubscriptions.length <= 1}
                aria-label="Previous subscription"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
              <span className="text-gray-200 text-lg font-medium">
                Plan {currentCardIndex + 1} of {filteredSubscriptions.length}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleNextCard}
                className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                disabled={filteredSubscriptions.length <= 1}
                aria-label="Next subscription"
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            </div>
            <div className="overflow-hidden">
              <motion.div
                animate={{ x: `-${currentCardIndex * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="flex"
              >
                {filteredSubscriptions.map((subscription, index) => (
                  <motion.div
                    key={subscription._id}
                    className="w-full flex-shrink-0 bg-gradient-to-br from-white/10 via-white/15 to-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    {/* Card Header */}
                    <div className="mb-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <motion.div
                            whileHover={{ rotate: 10 }}
                            className="p-2 bg-purple-500/20 rounded-full"
                          >
                            <User className="w-8 h-8 text-purple-400" />
                          </motion.div>
                          <div>
                            <h3 className="text-xl font-semibold text-white">
                              {subscription.plan?.doctorName ||
                                'Unknown Doctor'}
                            </h3>
                            <p className="text-gray-300 text-sm">
                              {subscription.plan?.name || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(
                            subscription.status
                          )} shadow-md`}
                        >
                          {getStatusIcon(subscription.status)}
                          {subscription.status.charAt(0).toUpperCase() +
                            subscription.status.slice(1)}
                        </span>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-4 rounded-lg"
                      >
                        <h4 className="text-2xl font-bold text-white">
                          {subscription.plan?.name || 'N/A'}
                        </h4>
                        <p className="text-3xl font-extrabold text-purple-300">
                          ₹{subscription.plan?.price || 0}
                        </p>
                      </motion.div>
                    </div>

                    {/* Card Body */}
                    <div>
                      {/* Appointment Usage */}
                      <div className="mb-8">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-gray-200">
                            Appointments Remaining
                          </span>
                          <span className="text-sm text-gray-200">
                            {subscription.appointmentsLeft || 0}/
                            {subscription.plan?.appointmentCount || 0}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-3 shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${
                                subscription.plan?.appointmentCount
                                  ? (subscription.appointmentsLeft /
                                      subscription.plan.appointmentCount) *
                                    100
                                  : 0
                              }%`,
                            }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full"
                          />
                        </div>
                      </div>

                      {/* Plan Description */}
                      <div className="mb-8">
                        <h5 className="text-sm font-medium text-gray-200 mb-3">
                          Plan Details
                        </h5>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {subscription.plan?.description ||
                            'No description available'}
                        </p>
                      </div>

                      {/* Dates */}
                      <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                          <Calendar className="w-5 h-5 text-purple-400" />
                          <span>
                            Started:{' '}
                            {subscription.createdAt
                              ? dayjs(subscription.createdAt).format(
                                  'MMM D, YYYY'
                                )
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                          <Clock className="w-5 h-5 text-purple-400" />
                          <span>
                            {subscription.status === 'active' &&
                            subscription.daysUntilExpiration !== undefined
                              ? `Expires: ${dayjs().add(subscription.daysUntilExpiration, 'day').format('MMM D, YYYY')}`
                              : subscription.expiryDate
                                ? `Expired: ${dayjs(subscription.expiryDate).format('MMM D, YYYY')}`
                                : 'No expiry date'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        {subscription.status === 'active' ? (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 text-sm font-medium shadow-md"
                              onClick={() => navigate(`/patient/find-doctor`)}
                            >
                              Book Appointment
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 shadow-md ${
                                canCancelSubscription(subscription)
                                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                                  : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
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
                            </motion.button>
                          </>
                        ) : canRenewSubscription(
                            subscription.status,
                            subscription._id
                          ) ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 text-sm font-medium shadow-md"
                            onClick={() => navigate(`/patient/find-doctor`)}
                          >
                            Renew Subscription
                          </motion.button>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-gray-200 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8"
          >
            <div className="flex flex-col items-center gap-4">
              <Stethoscope className="w-12 h-12 text-purple-400" />
              <p>
                No {filterStatus === 'all' ? '' : filterStatus} subscriptions
                found.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 text-sm font-medium"
                onClick={() => navigate('/patient/find-doctor')}
              >
                Explore Plans
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Appointments Table */}
        {filteredSubscriptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6 text-center">
              Appointments for{' '}
              {filteredSubscriptions[currentCardIndex]?.plan?.name ||
                'Selected Plan'}
            </h2>
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
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
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Subscriptions;
