import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MessageSquare, Video } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { cancelAppointmentThunk } from '../../redux/thunks/patientThunk';
import { DateUtils } from '../../utils/DateUtils';
import axios from 'axios';
import CancelAppointmentModal from '../../components/CancelAppointmentModal';

interface AppointmentPatient {
  _id: string;
  name: string;
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

interface Appointment {
  _id: string;
  patientId: AppointmentPatient;
  doctorId: AppointmentDoctor;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'completed' | 'cancelled';
  isFreeBooking: boolean;
  bookingTime: string;
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
}

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const VideoCallModal: React.FC<{
  doctorName: string;
  appointment: Appointment;
  onAccept: () => void;
  onDecline: () => void;
}> = ({ doctorName, appointment, onAccept, onDecline }) => {
  const [countdown, setCountdown] = useState(30);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [onDecline]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-white mb-4">
          Incoming Video Call
        </h3>
        <p className="text-gray-200 mb-4">
          Dr. {doctorName} is calling for your appointment at{' '}
          {DateUtils.formatTimeToLocal(appointment.startTime)}.
        </p>
        <p className="text-yellow-300 text-sm mb-4">
          Call will auto-decline in {countdown} seconds...
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onAccept}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.5-4.5M21 12h-6m6 0l-4.5 4.5M9 6v12"
              />
            </svg>
            Accept
          </button>
          <button
            onClick={onDecline}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

const AppointmentDetails: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [showCallModal, setShowCallModal] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

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
        setAppointment(appt);
      } catch (error) {
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

  const handleStartVideoCall = () => {
    if (!isWithinAppointmentTime()) {
      toast.error('Video calls are only available during the appointment time');
      return;
    }

    if (appointment?.status !== 'pending') {
      toast.error('Video call is only available for pending appointments');
      return;
    }

    if (!user || !user._id) {
      toast.error('User not authenticated');
      return;
    }
  };

  const handleAcceptCall = () => {
  };

  const handleDeclineCall = () => {
    setShowCallModal(false);
    if (appointment?._id && appointment?.doctorId._id && user?._id) {
      toast.info('Video call declined');
    } else {
      toast.error(
        'Cannot decline call: Missing appointment or user information'
      );
    }
  };

  const handleOpenChat = () => {
    if (appointment?.doctorId._id) {
      navigate(
        `/patient/profile?tab=messages&thread=${appointment.doctorId._id}`
      );
    } else {
      toast.error('Cannot open chat: Doctor information missing');
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
      {showCallModal && (
        <VideoCallModal
          doctorName={appointment.doctorId.name}
          appointment={appointment}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}
      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelAppointment}
        appointmentId={appointmentId || ''}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
            Appointment Details
          </h2>
          {/* <button
            onClick={() => navigate('/patient/profile?tab=appointments')}
            className="text-white hover:text-gray-300 transition-colors text-sm sm:text-base"
          >
            ← Back to Appointments
          </button> */}
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
                {appointment.doctorId.name}
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

        {appointment.doctorId && (
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
                      {appointment.doctorId.speciality.join(', ')}
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
        )}

        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
            Consultation
          </h3>
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-200 text-center">
              Connect with Dr. {appointment.doctorId.name} for your consultation
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
