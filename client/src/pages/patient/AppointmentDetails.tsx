/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MessageSquare, Video } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { cancelAppointmentThunk } from '../../redux/thunks/patientThunk';
import { DateUtils } from '../../utils/DateUtils';
import axios from 'axios';
import CancelAppointmentModal from '../../components/CancelAppointmentModal';
import VideoCallModal from '../../components/VideoCallModal';
import { useSocket } from '../../hooks/useSocket';
import { createReview } from '../../services/patientService';

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
  _id: string;
  appointmentId: string;
  patientId: string | { _id: string; name: string };
  doctorId: string | { _id: string; name: string };
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    _id?: string;
  }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
  };
  hasReview?: boolean;
}

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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
  const [comment, setComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!user?._id) {
      toast.error('Please log in to view appointment details');
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${API_URL}/api/patients/appointments/${appointmentId}`,
          {
            withCredentials: true,
          }
        );

        const appt = response.data;
        if (typeof appt.patientId === 'string') {
          appt.patientId = { _id: appt.patientId, name: 'Unknown Patient' };
        }
        if (typeof appt.doctorId === 'string') {
          appt.doctorId = { _id: appt.doctorId, name: 'Unknown Doctor' };
        }
        if (appt.prescriptionId) {
          appt.prescription = {
            medications: appt.prescriptionId.medications.map((med: any) => ({
              name: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration,
            })),
            notes: appt.prescriptionId.notes,
          };
        }
        setAppointment(appt);
      } catch (error: unknown) {
        console.error('Failed to load appointment details:', error);
        toast.error('Failed to load appointment details');
        setAppointment(null);
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointmentDetails();
    }
  }, [appointmentId]);

  useEffect(() => {
    if (!socket || !appointment) return;

    const handlers = {
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
          toast.info(`Incoming call from ${data.callerRole}`);
        }
      },
      onCallAccepted: (data: { appointmentId: string; acceptorId: string }) => {
        if (data.appointmentId === appointmentId) {
          setIsVideoCallOpen(true);
          setIsCaller(true);
          toast.success('Call accepted');
        }
      },
      onCallRejected: (data: { appointmentId: string; rejectorId: string }) => {
        if (data.appointmentId === appointmentId) {
          setIsVideoCallOpen(false);
          setCallerInfo(undefined);
          toast.info('Call rejected');
        }
      },
    };

    registerHandlers(handlers);

    return () => {
      // Handlers are managed by SocketContext
    };
  }, [socket, appointment, appointmentId, registerHandlers]);

  const isWithinAppointmentTime = useCallback(() => {
    if (!appointment) return false;
    const now = new Date();
    const startTime = new Date(
      `${appointment.date.split('T')[0]}T${appointment.startTime}`
    );
    const endTime = new Date(
      `${appointment.date.split('T')[0]}T${appointment.endTime}`
    );
    return (
      now >= startTime && now <= endTime && appointment.status === 'pending'
    );
  }, [appointment]);

  const handleCancelAppointment = async (cancellationReason: string) => {
    if (!appointmentId || !user?._id) {
      toast.error('User not authenticated');
      return;
    }
    try {
      await dispatch(
        cancelAppointmentThunk({ appointmentId, cancellationReason })
      ).unwrap();
      toast.success('Appointment cancelled successfully');
      setAppointment((prev) =>
        prev ? { ...prev, status: 'cancelled', cancellationReason } : prev
      );
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  const handleStartVideoCall = async () => {
    if (
      !appointment ||
      !user?._id ||
      typeof appointment.doctorId === 'string'
    ) {
      toast.error(
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
    } catch (error) {
      console.error('Failed to initiate video call:', error);
      toast.error('Failed to start video call');
    }
  };

  const handleOpenChat = () => {
    if (
      appointment?.doctorId &&
      typeof appointment.doctorId !== 'string' &&
      appointment.doctorId._id
    ) {
      navigate(
        `/patient/messages?thread=${appointment.doctorId._id}`
      );
    } else {
      toast.error('Cannot open chat: Doctor information missing');
    }
  };

  const handleSubmitReview = async () => {
    if (
      !appointment ||
      typeof appointment.doctorId === 'string' ||
      !user?._id
    ) {
      toast.error('Cannot submit review: Missing required information');
      return;
    }
    if (rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please enter a comment');
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
      toast.success('Review submitted successfully');
      setAppointment((prev) => (prev ? { ...prev, hasReview: true } : prev));
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Appointment not found</h2>
          <button
            onClick={() => navigate('/patient/profile?tab=appointments')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8">
      <ToastContainer position="bottom-right" autoClose={3000} theme="dark" />
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
        receiverId={
          typeof appointment.doctorId !== 'string'
            ? appointment.doctorId._id
            : ''
        }
        isCaller={isCaller}
        callerInfo={callerInfo}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
            Appointment Details
          </h2>
        </div>

        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
            Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-200">
                <span className="font-medium">Date:</span>{' '}
                {DateUtils.formatToLocal(appointment.date)}
              </p>
              <p className="text-sm text-gray-200">
                <span className="font-medium">Time:</span>{' '}
                {DateUtils.formatTimeToLocal(appointment.startTime)} -{' '}
                {DateUtils.formatTimeToLocal(appointment.endTime)}
              </p>
              <p className="text-sm text-gray-200">
                <span className="font-medium">Doctor:</span> Dr.{' '}
                {typeof appointment.doctorId === 'string'
                  ? 'Unknown Doctor'
                  : appointment.doctorId.name}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-200">
                <span className="font-medium">Status:</span>{' '}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    appointment.status === 'pending'
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : appointment.status === 'completed'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {appointment.status.charAt(0).toUpperCase() +
                    appointment.status.slice(1)}
                </span>
              </p>
              <p className="text-sm text-gray-200">
                <span className="font-medium">Type:</span>{' '}
                {appointment.isFreeBooking ? 'Free' : 'Subscribed'}
              </p>
              <p className="text-sm text-gray-200">
                <span className="font-medium">Booked:</span>{' '}
                {DateUtils.formatToLocal(appointment.bookingTime)}
              </p>
              {appointment.status === 'cancelled' &&
                appointment.cancellationReason && (
                  <p className="text-sm text-gray-200">
                    <span className="font-medium">Cancellation Reason:</span>{' '}
                    {appointment.cancellationReason}
                  </p>
                )}
            </div>
          </div>

          {appointment.status === 'pending' && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="mt-4 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300"
            >
              Cancel Appointment
            </button>
          )}
        </div>

        {appointment.status === 'completed' && !appointment.hasReview && (
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
              Submit a Review
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-200 text-sm mb-2">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-2xl ${
                        rating >= star ? 'text-yellow-400' : 'text-gray-400'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-gray-200 text-sm mb-2">
                  Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  rows={4}
                  placeholder="Write your review..."
                />
              </div>
              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50"
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        )}

        {/* {appointment.doctorId && typeof appointment.doctorId !== 'string' && (
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
              Doctor Information
            </h3>
            <div className="flex items-center gap-4">
              {appointment.doctorId.profilePicture && (
                <img
                  src={appointment.doctorId.profilePicture}
                  alt={`Dr. ${appointment.doctorId.name}`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                />
              )}
              <div>
                <h4 className="text-white font-medium">
                  Dr. {appointment.doctorId.name}
                </h4>
                {appointment.doctorId.speciality &&
                  appointment.doctorId.speciality.length > 0 && (
                    <p className="text-gray-300 text-sm">
                      {appointment.doctorId.speciality}
                    </p>
                  )}
                {appointment.doctorId.qualifications &&
                  appointment.doctorId.qualifications.length > 0 && (
                    <p className="text-gray-400 text-xs">
                      {appointment.doctorId.qualifications.join(', ')}
                    </p>
                  )}
              </div>
            </div>
          </div>
        )} */}

        {appointment.prescription && (
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
              Prescription
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm text-gray-300">Medications</h4>
                {appointment.prescription.medications.map((med, index) => (
                  <div key={index} className="border-b border-white/20 py-2">
                    <p className="text-white">
                      <strong>Name:</strong> {med.name}
                    </p>
                    <p className="text-white">
                      <strong>Dosage:</strong> {med.dosage}
                    </p>
                    <p className="text-white">
                      <strong>Frequency:</strong> {med.frequency}
                    </p>
                    <p className="text-white">
                      <strong>Duration:</strong> {med.duration}
                    </p>
                  </div>
                ))}
              </div>
              {appointment.prescription.notes && (
                <div>
                  <h4 className="text-sm text-gray-300">Additional Notes</h4>
                  <p className="text-white">{appointment.prescription.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
            Consultation
          </h3>
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-200 text-center">
              Connect with Dr.{' '}
              {typeof appointment.doctorId === 'string'
                ? 'Unknown Doctor'
                : appointment.doctorId.name}{' '}
              for your consultation
            </p>

            <div className="flex gap-4">
              <button
                onClick={handleOpenChat}
                className="flex items-center gap-2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 group"
                title="Chat with Doctor"
              >
                <MessageSquare className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                <span className="text-white text-sm">Chat</span>
              </button>

              <button
                onClick={handleStartVideoCall}
                className="flex items-center gap-2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  !isWithinAppointmentTime()
                    ? 'Video call available during appointment time'
                    : appointment.status !== 'pending'
                      ? 'Video call only available for pending appointments'
                      : 'Start Video Call'
                }
                disabled={
                  !isWithinAppointmentTime() || appointment.status !== 'pending'
                }
              >
                <Video className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                <span className="text-white text-sm">Video Call</span>
              </button>
            </div>

            {!isWithinAppointmentTime() && appointment.status === 'pending' && (
              <p className="text-yellow-300 text-sm text-center">
                Video call will be available during your appointment time:
                <br />
                {DateUtils.formatTimeToLocal(appointment.startTime)} -{' '}
                {DateUtils.formatTimeToLocal(appointment.endTime)}
              </p>
            )}

            <button
              onClick={handleOpenChat}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
            >
              Have questions? Chat with doctor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;
