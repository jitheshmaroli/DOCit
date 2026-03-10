/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Video,
  Star,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { cancelAppointmentThunk } from '../../redux/thunks/patientThunk';
import { DateUtils } from '../../utils/DateUtils';
import CancelAppointmentModal from '../../components/CancelAppointmentModal';
import VideoCallModal from '../../components/VideoCallModal';
import { useSocket } from '../../hooks/useSocket';
import { createReview } from '../../services/patientService';
import api from '../../services/api';
import { showError, showInfo, showSuccess } from '../../utils/toastConfig';
import ROUTES from '../../constants/routeConstants';

interface AppointmentPatient {
  _id: string;
  name: string;
  profilePicture?: string;
}

interface AppointmentDoctor {
  _id: string;
  name: string;
  profilePicture?: string;
  speciality?: string[];
  qualifications?: string[];
  age?: number;
  gender?: string;
}

interface Prescription {
  _id?: string;
  appointmentId?: string;
  patientId?: string | { _id: string; name: string };
  doctorId?: string | { _id: string; name: string };
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    _id?: string;
  }>;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  pdfUrl?: string;
}

interface Appointment {
  _id: string;
  patientId: AppointmentPatient | string;
  doctorId: AppointmentDoctor | string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'completed' | 'cancelled';
  isFreeBooking: boolean;
  bookingTime: string;
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
  prescriptionId?: Prescription;
  prescription?: {
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    notes?: string;
    pdfUrl?: string;
  };
  hasReview?: boolean;
}

// Helpers
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    pending: {
      cls: 'bg-amber-100 text-amber-700 border border-amber-200',
      icon: <Clock size={11} />,
    },
    completed: {
      cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      icon: <CheckCircle size={11} />,
    },
    cancelled: {
      cls: 'bg-red-100 text-error border border-red-200',
      icon: <XCircle size={11} />,
    },
  };
  const { cls, icon } = map[status] || { cls: 'badge-neutral', icon: null };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}
    >
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const InfoRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3">
    <span className="text-xs font-semibold text-text-muted uppercase tracking-wide w-28 flex-shrink-0">
      {label}
    </span>
    <span className="text-sm text-text-primary">{children}</span>
  </div>
);

const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="card p-6 mb-5">
    <div className="flex items-center gap-2.5 mb-5">
      {icon && (
        <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500">
          {icon}
        </div>
      )}
      <h2 className="font-display font-bold text-text-primary text-lg">
        {title}
      </h2>
    </div>
    {children}
  </div>
);

// Component
const AppointmentDetails: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { socket, registerHandlers } = useSocket();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [callerInfo, setCallerInfo] = useState<
    { callerId: string; callerRole: string } | undefined
  >(undefined);
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showFullNotes, setShowFullNotes] = useState(false);

  useEffect(() => {
    if (!user?._id) {
      showError('Please log in to view appointment details');
      navigate(ROUTES.PUBLIC.LOGIN);
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `/api/patients/appointments/${appointmentId}`,
          { withCredentials: true }
        );
        const appt = response.data;
        if (typeof appt.patientId === 'string')
          appt.patientId = { _id: appt.patientId, name: 'Unknown Patient' };
        if (typeof appt.doctorId === 'string')
          appt.doctorId = { _id: appt.doctorId, name: 'Unknown Doctor' };
        if (appt.prescriptionId && typeof appt.prescriptionId === 'object') {
          appt.prescription = {
            medications: appt.prescriptionId.medications.map((med: any) => ({
              name: med.name || '',
              dosage: med.dosage || '',
              frequency: med.frequency || '',
              duration: med.duration || '',
            })),
            notes: appt.prescriptionId.notes || undefined,
            pdfUrl: appt.prescriptionId.pdfUrl || undefined,
          };
        }
        setAppointment(appt);
      } catch {
        showError('Failed to load appointment details');
        setAppointment(null);
      } finally {
        setLoading(false);
      }
    };
    if (appointmentId) fetchAppointmentDetails();
  }, [appointmentId]);

  useEffect(() => {
    if (!socket || !appointment) return;
    registerHandlers({
      onIncomingCall: (data: {
        appointmentId: string;
        callerId: string;
        callerRole: string;
      }) => {
        if (data.appointmentId === appointmentId) {
          setCallerInfo({
            callerId: data.callerId,
            callerRole: data.callerRole,
          });
          setIsVideoCallOpen(true);
          setIsCaller(false);
          showInfo(`Incoming call from ${data.callerRole}`);
        }
      },
      onCallAccepted: (data: { appointmentId: string; acceptorId: string }) => {
        if (data.appointmentId === appointmentId) {
          setIsVideoCallOpen(true);
          setIsCaller(true);
          showSuccess('Call accepted');
        }
      },
      onCallRejected: (data: { appointmentId: string; rejectorId: string }) => {
        if (data.appointmentId === appointmentId) {
          setIsVideoCallOpen(false);
          setCallerInfo(undefined);
          showInfo('Call rejected');
        }
      },
    });
  }, [socket, appointment, appointmentId, registerHandlers]);

  const isWithinAppointmentTime = useCallback(() => {
    if (!appointment) return false;
    const now = new Date();
    const base = appointment.date.split('T')[0];
    return (
      now >= new Date(`${base}T${appointment.startTime}`) &&
      now <= new Date(`${base}T${appointment.endTime}`) &&
      appointment.status === 'pending'
    );
  }, [appointment]);

  const isFutureAppointment = useCallback(() => {
    if (!appointment) return false;
    return (
      new Date() <
        new Date(
          `${appointment.date.split('T')[0]}T${appointment.startTime}`
        ) && appointment.status === 'pending'
    );
  }, [appointment]);

  const handleCancelAppointment = async (cancellationReason: string) => {
    if (!appointmentId || !user?._id) {
      showError('User not authenticated');
      return;
    }
    try {
      await dispatch(
        cancelAppointmentThunk({ appointmentId, cancellationReason })
      ).unwrap();
      showSuccess('Appointment cancelled successfully');
      setAppointment((prev) =>
        prev ? { ...prev, status: 'cancelled', cancellationReason } : prev
      );
    } catch {
      showError('Failed to cancel appointment');
    }
  };

  const handleStartVideoCall = async () => {
    if (
      !appointment ||
      !user?._id ||
      typeof appointment.doctorId === 'string'
    ) {
      showError(
        'Cannot start video call: Missing appointment or doctor information'
      );
      return;
    }
    try {
      await socket?.emit('initiateVideoCall', {
        appointmentId,
        receiverId: appointment.doctorId._id,
      });
      setIsVideoCallOpen(true);
      setIsCaller(true);
    } catch {
      showError('Failed to start video call');
    }
  };

  const handleOpenChat = () => {
    if (
      appointment?.doctorId &&
      typeof appointment.doctorId !== 'string' &&
      appointment.doctorId._id
    ) {
      navigate(`/patient/messages?thread=${appointment.doctorId._id}`, {
        replace: true,
      });
    }
  };

  const handleSubmitReview = async () => {
    if (
      !appointment ||
      typeof appointment.doctorId === 'string' ||
      !user?._id
    ) {
      showError('Cannot submit review: Missing required information');
      return;
    }
    if (rating < 1 || rating > 5) {
      showError('Please select a rating between 1 and 5');
      return;
    }
    if (!comment.trim()) {
      showError('Please enter a comment');
      return;
    }
    try {
      setIsSubmittingReview(true);
      await createReview(
        appointment._id,
        appointment.doctorId._id,
        rating,
        comment
      );
      showSuccess('Review submitted successfully');
      setAppointment((prev) => (prev ? { ...prev, hasReview: true } : prev));
      setRating(0);
      setComment('');
    } catch {
      showError('Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 size={36} className="animate-spin text-primary-500" />
        <p className="text-text-secondary text-sm">
          Loading appointment details...
        </p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-muted flex items-center justify-center">
          <AlertCircle size={28} className="text-text-muted" />
        </div>
        <h3 className="font-display font-bold text-text-primary text-xl">
          Appointment not found
        </h3>
        <button
          onClick={() => navigate('/patient/profile?tab=appointments')}
          className="btn-primary"
        >
          Back to Appointments
        </button>
      </div>
    );
  }

  const doctorName =
    typeof appointment.doctorId === 'string'
      ? 'Unknown Doctor'
      : appointment.doctorId.name;
  const doctorId =
    typeof appointment.doctorId === 'string' ? '' : appointment.doctorId._id;

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelAppointment}
        appointmentId={appointmentId || ''}
      />
      <VideoCallModal
        isOpen={isVideoCallOpen}
        onClose={() => {
          setIsVideoCallOpen(false);
          setCallerInfo(undefined);
        }}
        appointmentId={appointmentId || ''}
        userId={user?._id || ''}
        receiverId={doctorId}
        isCaller={isCaller}
        callerInfo={callerInfo}
      />

      {/* ── Overview ── */}
      <Section title="Appointment Overview" icon={<Calendar size={16} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <InfoRow label="Date">
            {DateUtils.formatToLocal(appointment.date)}
          </InfoRow>
          <InfoRow label="Time">
            {DateUtils.formatTimeToLocal(appointment.startTime)} –{' '}
            {DateUtils.formatTimeToLocal(appointment.endTime)}
          </InfoRow>
          <InfoRow label="Doctor">
            <span className="font-semibold text-text-primary">
              Dr. {doctorName}
            </span>
          </InfoRow>
          <InfoRow label="Status">
            <StatusBadge status={appointment.status} />
          </InfoRow>
          <InfoRow label="Type">
            <span
              className={`badge ${appointment.isFreeBooking ? 'bg-teal-100 text-teal-700' : 'badge-primary'}`}
            >
              {appointment.isFreeBooking ? 'Free Booking' : 'Subscribed'}
            </span>
          </InfoRow>
          <InfoRow label="Booked On">
            {DateUtils.formatToLocal(appointment.bookingTime)}
          </InfoRow>
          {appointment.status === 'cancelled' &&
            appointment.cancellationReason && (
              <div className="sm:col-span-2 mt-1">
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl">
                  <AlertTriangle
                    size={14}
                    className="text-error flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-xs font-semibold text-error mb-0.5">
                      Cancellation Reason
                    </p>
                    <p className="text-sm text-red-700">
                      {appointment.cancellationReason}
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>

        {appointment.status === 'pending' && isFutureAppointment() && (
          <button
            onClick={() => setIsCancelModalOpen(true)}
            className="btn-danger mt-6"
          >
            <XCircle size={15} /> Cancel Appointment
          </button>
        )}
      </Section>

      {/* ── Consultation ── */}
      <Section title="Consultation" icon={<MessageSquare size={16} />}>
        <p className="text-sm text-text-secondary mb-5">
          Connect with{' '}
          <strong className="text-text-primary">Dr. {doctorName}</strong> via
          chat or video call.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleOpenChat}
            className="btn-secondary flex items-center gap-2"
          >
            <MessageSquare size={16} /> Chat with Doctor
          </button>

          <button
            onClick={handleStartVideoCall}
            disabled={
              !isWithinAppointmentTime() || appointment.status !== 'pending'
            }
            title={
              !isWithinAppointmentTime()
                ? 'Video call available during appointment time'
                : appointment.status !== 'pending'
                  ? 'Available for pending appointments only'
                  : 'Start Video Call'
            }
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video size={16} /> Start Video Call
          </button>
        </div>

        {!isWithinAppointmentTime() && appointment.status === 'pending' && (
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-100 rounded-xl mt-4">
            <Clock size={14} className="text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Video call will be available during your appointment time:{' '}
              <strong>
                {DateUtils.formatTimeToLocal(appointment.startTime)} –{' '}
                {DateUtils.formatTimeToLocal(appointment.endTime)}
              </strong>
            </p>
          </div>
        )}
      </Section>

      {/* ── Prescription ── */}
      {appointment.prescription && (
        <Section title="Prescription" icon={<FileText size={16} />}>
          <div className="space-y-3 mb-5">
            {appointment.prescription.medications.map((med, i) => (
              <div
                key={i}
                className="bg-surface-bg rounded-xl border border-surface-border p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-text-primary text-sm">
                    {med.name}
                  </p>
                  <span className="badge-primary text-xs">{med.dosage}</span>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-secondary">
                  <span>
                    <span className="font-medium text-text-muted">
                      Frequency:
                    </span>{' '}
                    {med.frequency}
                  </span>
                  <span>
                    <span className="font-medium text-text-muted">
                      Duration:
                    </span>{' '}
                    {med.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {appointment.prescription.notes && (
            <div className="p-4 bg-surface-bg rounded-xl border border-surface-border mb-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                Additional Notes
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {showFullNotes || appointment.prescription.notes.length <= 150
                  ? appointment.prescription.notes
                  : `${appointment.prescription.notes.substring(0, 150)}...`}
              </p>
              {appointment.prescription.notes.length > 150 && (
                <button
                  onClick={() => setShowFullNotes(!showFullNotes)}
                  className="text-primary-600 hover:text-primary-700 text-xs font-medium mt-2 flex items-center gap-1"
                >
                  {showFullNotes ? (
                    <>
                      <ChevronUp size={12} /> Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={12} /> Show More
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {appointment.prescription.pdfUrl ? (
            <a
              href={appointment.prescription.pdfUrl}
              download
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Download size={15} /> Download Prescription PDF
            </a>
          ) : (
            <p className="text-xs text-text-muted">
              No prescription PDF available.
            </p>
          )}
        </Section>
      )}

      {/* ── Review ── */}
      {appointment.status === 'completed' && !appointment.hasReview && (
        <Section title="Leave a Review" icon={<Star size={16} />}>
          <p className="text-sm text-text-secondary mb-5">
            How was your experience with{' '}
            <strong className="text-text-primary">Dr. {doctorName}</strong>?
          </p>

          {/* Star picker */}
          <div className="mb-5">
            <label className="label mb-2">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoveredRating(s)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                  aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
                >
                  <Star
                    size={28}
                    className={`transition-colors ${
                      s <= (hoveredRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-surface-muted text-surface-border'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-semibold text-amber-500 self-center">
                  {
                    ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][
                      rating
                    ]
                  }
                </span>
              )}
            </div>
          </div>

          <div className="mb-5">
            <label className="label mb-2">Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input resize-none"
              rows={4}
              placeholder="Share your experience with this doctor..."
            />
          </div>

          <button
            onClick={handleSubmitReview}
            disabled={isSubmittingReview || rating === 0}
            className="btn-primary disabled:opacity-50"
          >
            {isSubmittingReview ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Star size={15} /> Submit Review
              </>
            )}
          </button>
        </Section>
      )}

      {appointment.status === 'completed' && appointment.hasReview && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-5">
          <CheckCircle
            size={16}
            className="text-success flex-shrink-0 mt-0.5"
          />
          <p className="text-sm text-emerald-700 font-medium">
            You've already submitted a review for this appointment.
          </p>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetails;
