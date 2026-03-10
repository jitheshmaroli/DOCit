import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { AppDispatch, RootState } from '../../../redux/store';
import {
  getPatientSubscriptionsThunk,
  cancelSubscriptionThunk,
  getAppointmentsBySubscriptionThunk,
} from '../../../redux/thunks/patientThunk';
import {
  clearError,
  clearRefundDetails,
} from '../../../redux/slices/patientSlice';
import {
  Appointment,
  ExtendedPatientSubscription,
} from '../../../types/authTypes';
import DataTable, { Column } from '../../../components/common/DataTable';
import dayjs from 'dayjs';
import { useAppSelector } from '../../../redux/hooks';
import ROUTES from '../../../constants/routeConstants';
import Pagination from '../../../components/common/Pagination';
import Modal from '../../../components/common/Modal';
import { debounce } from 'lodash';
import { showError, showSuccess } from '../../../utils/toastConfig';

// Helpers
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    active: {
      cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      icon: <CheckCircle size={11} />,
    },
    expired: {
      cls: 'bg-red-100 text-red-700 border border-red-200',
      icon: <XCircle size={11} />,
    },
    cancelled: {
      cls: 'bg-amber-100 text-amber-700 border border-amber-200',
      icon: <AlertCircle size={11} />,
    },
    pending: {
      cls: 'bg-primary-100 text-primary-700 border border-primary-200',
      icon: <Clock size={11} />,
    },
  };
  const { cls, icon } = map[status] || { cls: 'badge-neutral', icon: null };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}
    >
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const filterOptions = [
  { value: 'all', label: 'All Plans' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Component
const Subscriptions: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const {
    activeSubscriptions,
    appointments,
    loading,
    error,
    lastRefundDetails,
    totalItemsBySubscription,
  } = useSelector((state: RootState) => state.patient);
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 5;

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [modalMode, setModalMode] = useState<'cancel' | 'refund'>('cancel');
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<
    string | null
  >(null);

  useEffect(() => {
    dispatch(getPatientSubscriptionsThunk())
      .unwrap()
      .then((subs) => {
        subs.forEach((sub) =>
          dispatch(
            getAppointmentsBySubscriptionThunk({
              subscriptionId: sub._id,
              page: currentPage,
              limit,
            })
          )
        );
      });
    return () => {
      dispatch(clearError());
      dispatch(clearRefundDetails());
    };
  }, [dispatch, currentPage]);

  const filteredSubscriptions = activeSubscriptions.filter((s) =>
    filterStatus === 'all' ? true : s.status === filterStatus
  ) as ExtendedPatientSubscription[];

  const currentSubscription = filteredSubscriptions[currentCardIndex];
  const totalPages = currentSubscription
    ? Math.ceil(
        (totalItemsBySubscription[currentSubscription._id] || 0) / limit
      )
    : 1;

  const canCancelSubscription = (sub: ExtendedPatientSubscription) => {
    if (sub.status !== 'active' || !sub.createdAt) return false;
    if (sub.plan?.appointmentCount - sub.appointmentsLeft > 0) return false;
    return dayjs().diff(dayjs(sub.createdAt), 'minute') <= 30;
  };

  const canRenewSubscription = (status: string, id: string) => {
    if (status !== 'expired') return false;
    return !activeSubscriptions.some(
      (s) =>
        s.status === 'active' &&
        s._id !== id &&
        s.plan.doctorId ===
          activeSubscriptions.find((x) => x._id === id)?.plan.doctorId
    );
  };

  const debouncedCancel = debounce(async () => {
    if (!selectedSubscriptionId || !cancellationReason.trim()) {
      showError('Please provide a cancellation reason');
      return;
    }
    try {
      await dispatch(
        cancelSubscriptionThunk({
          subscriptionId: selectedSubscriptionId,
          cancellationReason,
        })
      ).unwrap();
      setModalMode('refund');
      showSuccess('Subscription cancelled successfully!');
    } catch {
      showError('Failed to cancel subscription');
      setIsCancelModalOpen(false);
      setCancellationReason('');
    }
  }, 1000);

  const handleCloseModal = () => {
    setIsCancelModalOpen(false);
    setCancellationReason('');
    setModalMode('cancel');
    setSelectedSubscriptionId(null);
    dispatch(clearRefundDetails());
  };

  const handlePrev = () => {
    setCurrentCardIndex((p) =>
      p === 0 ? filteredSubscriptions.length - 1 : p - 1
    );
    setCurrentPage(1);
  };
  const handleNext = () => {
    setCurrentCardIndex((p) =>
      p === filteredSubscriptions.length - 1 ? 0 : p + 1
    );
    setCurrentPage(1);
  };

  const currentSubForModal = activeSubscriptions.find(
    (s) => s._id === selectedSubscriptionId
  );

  // Summary stats
  const stats = [
    {
      label: 'Total Plans',
      value: filteredSubscriptions.length,
      icon: <Stethoscope size={20} className="text-primary-500" />,
      bg: 'bg-primary-50',
    },
    {
      label: 'Total Cost',
      value: `₹${filteredSubscriptions.reduce((s, sub) => s + (sub.plan?.price || 0), 0).toFixed(2)}`,
      icon: <CreditCard size={20} className="text-teal-500" />,
      bg: 'bg-teal-50',
    },
    {
      label: 'Appointments Left',
      value: filteredSubscriptions
        .filter((s) => s.status === 'active')
        .reduce((s, sub) => s + (sub.appointmentsLeft || 0), 0),
      icon: <TrendingUp size={20} className="text-accent-500" />,
      bg: 'bg-accent-50',
    },
  ];

  const appointmentColumns: Column<Appointment>[] = [
    {
      header: 'Date',
      accessor: (appt) => (
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-primary-400 flex-shrink-0" />
          <span className="text-sm text-text-primary font-medium">
            {new Date(appt.date).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Time',
      accessor: (appt) => (
        <span className="text-sm text-text-secondary">
          {appt.startTime} – {appt.endTime}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (appt) => <StatusBadge status={appt.status} />,
    },
    {
      header: 'Action',
      accessor: (appt) => (
        <button
          onClick={() => navigate(`/patient/appointment/${appt._id}`)}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          View Details
        </button>
      ),
    },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24 gap-3">
        <Loader2 size={24} className="animate-spin text-primary-500" />
        <span className="text-text-secondary text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* ── Page header ── */}
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Subscription Plans</h1>
          <p className="page-subtitle">
            Manage your doctor subscriptions and appointments
          </p>
        </div>
        {/* Filter */}
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setFilterStatus(opt.value);
                setCurrentCardIndex(0);
              }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150 ${
                filterStatus === opt.value
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-text-secondary border-surface-border hover:border-primary-300 hover:text-primary-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl mb-5"
          >
            <AlertCircle
              size={15}
              className="text-error flex-shrink-0 mt-0.5"
            />
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.map(({ label, value, icon, bg }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${bg}`}>{icon}</div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">{label}</p>
              <p className="text-2xl font-bold text-text-primary">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Subscription carousel ── */}
      {filteredSubscriptions.length > 0 ? (
        <div className="card p-6 mb-6">
          {/* Nav */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={handlePrev}
              disabled={filteredSubscriptions.length <= 1}
              className="btn-secondary p-2 disabled:opacity-40"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-text-secondary">
              Plan {currentCardIndex + 1} of {filteredSubscriptions.length}
            </span>
            <button
              onClick={handleNext}
              disabled={filteredSubscriptions.length <= 1}
              className="btn-secondary p-2 disabled:opacity-40"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Slide container */}
          <div className="overflow-hidden">
            <motion.div
              animate={{ x: `-${currentCardIndex * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="flex"
            >
              {filteredSubscriptions.map((sub) => (
                <div key={sub._id} className="w-full flex-shrink-0">
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <User size={22} className="text-primary-500" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-text-primary">
                          {sub.plan?.doctorName || 'Unknown Doctor'}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {sub.plan?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>

                  {/* Price highlight */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-teal-50 rounded-2xl border border-primary-100 mb-5">
                    <span className="text-sm text-text-secondary">
                      {sub.plan?.name || 'Plan'}
                    </span>
                    <span className="text-2xl font-bold text-primary-600">
                      ₹{sub.plan?.price || 0}
                    </span>
                  </div>

                  {/* Appointment usage */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                      <span className="font-semibold">
                        Appointments Remaining
                      </span>
                      <span>
                        {sub.appointmentsLeft || 0} /{' '}
                        {sub.plan?.appointmentCount || 0}
                      </span>
                    </div>
                    <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${sub.plan?.appointmentCount ? (sub.appointmentsLeft / sub.plan.appointmentCount) * 100 : 0}%`,
                        }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-teal-400"
                      />
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      {
                        label: 'Description',
                        value: sub.plan?.description || 'N/A',
                        span: true,
                      },
                      {
                        label: 'Start Date',
                        value: sub.createdAt
                          ? dayjs(sub.createdAt).format('MMM D, YYYY')
                          : 'N/A',
                      },
                      {
                        label: 'End Date',
                        value: sub.endDate
                          ? dayjs(sub.endDate).format('MMM D, YYYY')
                          : 'N/A',
                      },
                    ].map(({ label, value, span }) => (
                      <div
                        key={label}
                        className={`p-3 bg-surface-bg rounded-xl border border-surface-border ${span ? 'col-span-2' : ''}`}
                      >
                        <p className="text-xs text-text-muted mb-0.5">
                          {label}
                        </p>
                        <p className="text-sm font-medium text-text-primary">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Refund details */}
                  {sub.status === 'cancelled' && sub.refundId && (
                    <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl mb-5 space-y-1.5">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                        Refund Details
                      </p>
                      <div className="flex items-center gap-2 text-sm text-amber-700">
                        <CreditCard size={13} /> Refund ID: {sub.refundId}
                      </div>
                      {sub.refundAmount && (
                        <div className="flex items-center gap-2 text-sm text-amber-700">
                          <CreditCard size={13} /> Amount: ₹{sub.refundAmount}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {sub.status === 'active' ? (
                      <>
                        <button
                          onClick={() =>
                            navigate(
                              ROUTES.PATIENT.DOCTOR_DETAILS.replace(
                                ':doctorId',
                                sub.plan.doctorId
                              )
                            )
                          }
                          className="btn-primary flex-1 justify-center"
                        >
                          <Calendar size={15} /> Book Appointment
                        </button>
                        {canCancelSubscription(sub) && (
                          <button
                            onClick={() => {
                              setSelectedSubscriptionId(sub._id);
                              setIsCancelModalOpen(true);
                              setModalMode('cancel');
                            }}
                            disabled={loading}
                            className="btn-danger flex-1 justify-center disabled:opacity-50"
                          >
                            <XCircle size={15} /> Cancel Plan
                          </button>
                        )}
                      </>
                    ) : canRenewSubscription(sub.status, sub._id) ? (
                      <button
                        onClick={() =>
                          navigate(
                            ROUTES.PATIENT.DOCTOR_DETAILS.replace(
                              ':doctorId',
                              sub.plan.doctorId
                            )
                          )
                        }
                        className="btn-primary w-full justify-center"
                      >
                        <CheckCircle size={15} /> Renew Subscription
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="card p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <Stethoscope size={28} className="text-primary-400" />
          </div>
          <h3 className="font-display font-bold text-text-primary mb-2">
            No subscriptions found
          </h3>
          <p className="text-sm text-text-secondary mb-5">
            {filterStatus === 'all'
              ? 'Subscribe to a doctor plan to get started.'
              : `No ${filterStatus} subscriptions.`}
          </p>
          <button
            onClick={() => navigate('/patient/find-doctor')}
            className="btn-primary mx-auto"
          >
            Explore Plans
          </button>
        </div>
      )}

      {/* ── Appointments table ── */}
      {filteredSubscriptions.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-text-primary text-lg mb-4">
            Appointments for{' '}
            <span className="text-primary-600">
              {currentSubscription?.plan?.name || 'Selected Plan'}
            </span>
          </h2>
          <div className="card overflow-hidden mb-4">
            <DataTable
              data={
                currentSubscription?._id
                  ? appointments[currentSubscription._id] || []
                  : []
              }
              columns={appointmentColumns}
              isLoading={loading}
              error={error}
              emptyMessage="No appointments booked for this subscription."
            />
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* ── Cancel modal ── */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={handleCloseModal}
        title={
          modalMode === 'cancel' ? 'Cancel Subscription' : 'Refund Initiated'
        }
        description={
          modalMode === 'cancel' ? 'This action cannot be undone.' : undefined
        }
        footer={
          modalMode === 'cancel' ? (
            <>
              <button onClick={handleCloseModal} className="btn-secondary">
                Keep Plan
              </button>
              <button onClick={() => debouncedCancel()} className="btn-danger">
                Confirm Cancellation
              </button>
            </>
          ) : (
            <button onClick={handleCloseModal} className="btn-secondary">
              Close
            </button>
          )
        }
      >
        {modalMode === 'cancel' ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
              <AlertCircle
                size={15}
                className="text-warning flex-shrink-0 mt-0.5"
              />
              <p className="text-sm text-amber-700">
                You're about to cancel{' '}
                <strong>{currentSubForModal?.plan.name}</strong>. A full refund
                will be issued.
              </p>
            </div>
            <div>
              <label className="label">
                Cancellation Reason <span className="text-error">*</span>
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="input resize-none"
                rows={3}
                placeholder="Please tell us why you're cancelling..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
              <CheckCircle
                size={15}
                className="text-success flex-shrink-0 mt-0.5"
              />
              <p className="text-sm text-emerald-700">
                Subscription cancelled. Refund has been initiated.
              </p>
            </div>
            <div className="card p-4 space-y-1.5">
              <p className="text-sm text-text-secondary">
                Card ending in{' '}
                <strong className="text-text-primary">
                  {lastRefundDetails?.cardLast4 || 'N/A'}
                </strong>
              </p>
              <p className="text-sm text-text-secondary">
                Amount:{' '}
                <strong className="text-text-primary">
                  ₹{lastRefundDetails?.amount.toFixed(2) || '0.00'}
                </strong>
              </p>
              <p className="text-xs text-text-muted font-mono">
                Refund ID: {lastRefundDetails?.refundId}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Subscriptions;
