// src/pages/patient/AppointmentDetails.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MessageSquare, Video } from 'lucide-react'; // Add Video import
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { cancelAppointmentThunk } from '../../redux/thunks/patientThunk';
import { DateUtils } from '../../utils/DateUtils';
import axios from 'axios';
import { ChatBox } from '../../components/ChatBox';
import { VideoCall } from '../../components/VideoCall';
import { useSocket } from '../../hooks/useSocket';
import { useSendMessage } from '../../hooks/useSendMessage';
import { fetchMessages } from '../../services/messageService';
import { Message, MessageThread } from '../../types/messageTypes';

interface Appointment {
  _id: string;
  patientId: { _id: string; name: string }; // Update to ensure object type
  doctorId: {
    _id: string;
    name: string;
    profilePicture?: string;
    speciality?: string[];
    qualifications?: string[];
    age?: number;
    gender?: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  isFreeBooking: boolean;
  bookingTime: string;
  createdAt: string;
  updatedAt: string;
}

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AppointmentDetails: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [chatThread, setChatThread] = useState<MessageThread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false); // Add state
  const [loading, setLoading] = useState(true);

  const { emit } = useSocket(user?._id, {
    onReceiveMessage: (message: Message) => {
      if (
        message.senderId === user?._id ||
        !chatThread ||
        message.senderId !== appointment?.doctorId._id
      )
        return;
      setChatThread((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, { ...message, isSender: false }],
              timestamp: message.timestamp,
              latestMessage: {
                _id: message.id,
                message: message.message,
                createdAt: message.timestamp,
                isSender: false,
              },
            }
          : prev
      );
    },
  });

  const { sendMessage } = useSendMessage();

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
        // Ensure patientId is an object
        const appt = response.data;
        if (typeof appt.patientId === 'string') {
          appt.patientId = { _id: appt.patientId, name: 'Unknown' };
        }
        setAppointment(appt);
      } catch {
        toast.error('Failed to load appointment details');
        setAppointment(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointmentDetails();
  }, [appointmentId]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!appointment?.doctorId._id) return;
      try {
        const messages = await fetchMessages(appointment.doctorId._id);
        setChatThread({
          id: appointment.doctorId._id,
          receiverId: appointment.doctorId._id,
          senderName: appointment.doctorId.name,
          subject: 'Appointment Chat',
          timestamp: new Date().toISOString(),
          partnerProfilePicture: appointment.doctorId.profilePicture,
          latestMessage: null,
          messages: messages.map((msg) => ({
            id: msg._id,
            message: msg.message,
            senderId: msg.senderId,
            senderName: msg.senderName || 'Unknown',
            timestamp: msg.timestamp,
            isSender: msg.senderId === user?._id,
          })),
        });
      } catch {
        toast.error('Failed to load messages');
      }
    };
    loadMessages();
  }, [
    appointment?.doctorId._id,
    appointment?.doctorId.name,
    appointment?.doctorId.profilePicture,
    user?._id,
  ]); // Add dependencies

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment?.doctorId._id || !chatThread) return;

    const message = await sendMessage({
      receiverId: appointment.doctorId._id,
      messageText: newMessage,
      emit,
    });

    if (message) {
      setChatThread((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, message],
              timestamp: message.timestamp,
              latestMessage: {
                _id: message.id,
                message: message.message,
                createdAt: message.timestamp,
                isSender: true,
              },
            }
          : prev
      );
      setNewMessage('');
    }
  };

  const isWithinAppointmentTime = () => {
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
  };

  const handleCancelAppointment = async () => {
    if (!appointmentId || !user?._id) {
      toast.error('User not authenticated');
      return;
    }
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this appointment?'
    );
    if (!confirmCancel) return;

    try {
      await dispatch(cancelAppointmentThunk(appointmentId)).unwrap();
      toast.success('Appointment cancelled successfully');
      setAppointment((prev) =>
        prev ? { ...prev, status: 'cancelled' } : prev
      );
    } catch {
      toast.error('Failed to cancel appointment');
    }
  };

  if (loading) {
    return <div className="text-white text-center py-8">Loading...</div>;
  }

  if (!appointment) {
    return (
      <div className="text-white text-center py-8">Appointment not found</div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8">
      <ToastContainer position="bottom-right" autoClose={3000} theme="dark" />
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
          Appointment Details
        </h2>
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p className="text-sm text-gray-200">
              Date: {DateUtils.formatToLocal(appointment.date)}
            </p>
            <p className="text-sm text-gray-200">
              Time: {DateUtils.formatTimeToLocal(appointment.startTime)} -{' '}
              {DateUtils.formatTimeToLocal(appointment.endTime)}
            </p>
            <p className="text-sm text-gray-200">
              Doctor Name: Dr. {appointment.doctorId.name}
            </p>
            <p className="text-sm text-gray-200">
              Status: {appointment.status}
            </p>
            <p className="text-sm text-gray-200">
              Type: {appointment.isFreeBooking ? 'Free' : 'Subscribed'}
            </p>
            <p className="text-sm text-gray-200">
              Booked On: {DateUtils.formatToLocal(appointment.bookingTime)}
            </p>
          </div>
          <button
            onClick={handleCancelAppointment}
            className="mt-4 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 disabled:opacity-50"
            disabled={appointment.status !== 'pending'}
          >
            Cancel Appointment
          </button>
        </div>
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            Consultation
          </h3>
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-200">
              Join your consultation with Dr. {appointment.doctorId.name}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsChatOpen(true)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
                title="Chat with Doctor"
              >
                <MessageSquare className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={() => setIsVideoCallActive(true)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 disabled:opacity-50"
                title="Start Video Call"
                disabled={
                  !isWithinAppointmentTime() || appointment.status !== 'pending'
                }
              >
                <Video className="w-6 h-6 text-white" />
              </button>
            </div>
            <button
              onClick={() => setIsChatOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
            >
              Have doubts? Chat with doctor
            </button>
          </div>
        </div>
        {isChatOpen && chatThread && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <ChatBox
                thread={chatThread}
                newMessage={newMessage}
                onMessageChange={setNewMessage}
                onSendMessage={handleSendMessage}
                onBackToInbox={() => setIsChatOpen(false)}
                onVideoCall={() => setIsVideoCallActive(true)}
                isVideoCallDisabled={
                  !isWithinAppointmentTime() || appointment.status !== 'pending'
                }
              />
              <button
                onClick={() => setIsChatOpen(false)}
                className="mt-4 w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
        {isVideoCallActive && appointment && (
          <VideoCall
            appointment={appointment}
            isInitiator={false}
            onClose={() => setIsVideoCallActive(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AppointmentDetails;
