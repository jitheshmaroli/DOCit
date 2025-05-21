// src/pages/doctor/DoctorAppointments.tsx
import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { getAppointmentsThunk } from '../../redux/thunks/doctorThunk';
import { Patient } from '../../types/authTypes';
import { MessageSquare, Video } from 'lucide-react';
import { DateUtils } from '../../utils/DateUtils';
import { ChatBox } from '../../components/ChatBox';
import { VideoCall } from '../../components/VideoCall';
import { useSocket } from '../../hooks/useSocket';
import { useSendMessage } from '../../hooks/useSendMessage';
import { fetchMessages } from '../../services/messageService';
import { Message, MessageThread } from '../../types/messageTypes';

interface Appointment {
  _id: string;
  patientId: { _id: string; name: string; profilePicture?: string };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

const PatientDetailsModal: React.FC<{
  patient: Patient | null;
  onClose: () => void;
}> = ({ patient, onClose }) => {
  if (!patient) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
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
        </button>
        <div className="flex flex-col items-center mb-6">
          {patient.profilePicture ? (
            <img
              src={patient.profilePicture}
              alt={patient.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-white/50"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl text-white">
              {patient.name.charAt(0).toUpperCase()}
            </div>
          )}
          <h3 className="mt-4 text-xl font-bold text-white">{patient.name}</h3>
          <p className="text-gray-300">{patient.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-white">
          <div>
            <p className="text-sm text-gray-300">Phone</p>
            <p className="font-medium">{patient.phone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-300">Age</p>
            <p className="font-medium">{patient.age || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-300">Gender</p>
            <p className="font-medium">{patient.gender || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-300">Status</p>
            <p className="font-medium">
              {patient.isBlocked ? (
                <span className="text-red-400">Blocked</span>
              ) : (
                <span className="text-green-400">Active</span>
              )}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-300">Address</p>
            <p className="font-medium">{patient.address || 'N/A'}</p>
            {patient.pincode && (
              <p className="text-sm text-gray-300">
                Pincode: {patient.pincode}
              </p>
            )}
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-300">Subscription</p>
            <p className="font-medium">
              {patient.isSubscribed ? (
                <span className="text-green-400">Subscribed</span>
              ) : (
                <span className="text-yellow-400">Not Subscribed</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const DoctorAppointments: React.FC = () => {
  const dispatch = useAppDispatch();
  const { appointments = [] } = useAppSelector((state) => state.doctors);
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [chatModal, setChatModal] = useState<{
    patient: Patient;
    appointment: Appointment;
  } | null>(null);
  const [videoCallModal, setVideoCallModal] = useState<Appointment | null>(
    null
  );
  const [newMessage, setNewMessage] = useState('');
  const [chatThread, setChatThread] = useState<MessageThread | null>(null);

  const { emit } = useSocket(user?._id, {
    onReceiveMessage: (message: Message) => {
      if (
        message.senderId === user?._id ||
        !chatModal ||
        message.senderId !== chatModal.patient._id
      )
        return;
      setChatThread((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...prev.messages,
                { ...message, isSender: false },
              ].sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime()
              ),
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
    if (user?.role === 'doctor') {
      dispatch(getAppointmentsThunk());
    }
  }, [dispatch, user?.role]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!chatModal?.patient._id) return;
      try {
        const messages = await fetchMessages(chatModal.patient._id);
        setChatThread({
          id: chatModal.patient._id,
          receiverId: chatModal.patient._id,
          senderName: chatModal.patient.name,
          subject: 'Appointment Chat',
          timestamp: new Date().toISOString(),
          partnerProfilePicture: chatModal.patient.profilePicture,
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
      } catch (error) {
        console.error('Fetch messages error:', error);
        toast.error('Failed to load messages');
      }
    };
    loadMessages();
  }, [
    chatModal?.patient._id,
    chatModal?.patient.name,
    chatModal?.patient.profilePicture,
    user?._id,
  ]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatModal?.patient._id || !chatThread) return;

    const message = await sendMessage({
      receiverId: chatModal.patient._id,
      messageText: newMessage,
      emit,
    });

    if (message) {
      setChatThread((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, message].sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime()
              ),
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

  const filteredAppointments = Array.isArray(appointments)
    ? appointments.filter(
        (appt) =>
          appt.patientId?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          DateUtils.formatToLocal(appt.date).includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <PatientDetailsModal
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
      {chatModal && chatThread && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] flex flex-col">
            <ChatBox
              thread={chatThread}
              newMessage={newMessage}
              onMessageChange={setNewMessage}
              onSendMessage={handleSendMessage}
              onBackToInbox={() => setChatModal(null)}
            />
            <button
              onClick={() => setChatModal(null)}
              className="mt-4 w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {videoCallModal && (
        <VideoCall
          appointment={videoCallModal}
          isInitiator={true}
          onClose={() => setVideoCallModal(null)}
        />
      )}
      <div className="bg-white/10 backdrop-blur-lg p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl">
        <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
          Appointments
        </h2>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search appointments..."
            className="w-full md:w-1/3 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white/20 backdrop-blur-lg border border-white/20 rounded-lg">
            <thead>
              <tr className="bg-white/10 border-bottom border-white/20">
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Time
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
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appt) => (
                  <tr
                    key={appt._id}
                    className="hover:bg-white/30 transition-all duration-300"
                  >
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">
                      <button
                        onClick={() => setSelectedPatient(appt.patientId)}
                        className="hover:underline hover:text-blue-300 focus:outline-none"
                      >
                        {appt.patientId.name || 'N/A'}
                      </button>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {DateUtils.formatToLocal(appt.date)}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {DateUtils.formatTimeToLocal(appt.startTime)} -{' '}
                      {DateUtils.formatTimeToLocal(appt.endTime)}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appt.status === 'confirmed'
                            ? 'bg-green-500/20 text-green-300'
                            : appt.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {appt.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setChatModal({
                              patient: appt.patientId,
                              appointment: appt,
                            })
                          }
                          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
                          title="Chat with Patient"
                        >
                          <MessageSquare className="w-5 h-5 text-white" />
                        </button>
                        <button
                          onClick={() => setVideoCallModal(appt)}
                          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 disabled:opacity-50"
                          title="Start Video Call"
                          disabled={
                            !(
                              new Date() >=
                                new Date(
                                  `${appt.date.split('T')[0]}T${appt.startTime}`
                                ) &&
                              new Date() <=
                                new Date(
                                  `${appt.date.split('T')[0]}T${appt.endTime}`
                                ) &&
                              appt.status === 'pending'
                            )
                          }
                        >
                          <Video className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 md:px-6 py-4 text-center text-gray-200"
                  >
                    No appointments found.
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

export default DoctorAppointments;
