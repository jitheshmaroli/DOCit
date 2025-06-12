import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { getAppointmentsThunk } from '../../redux/thunks/doctorThunk';
import { MessageSquare, Video } from 'lucide-react';
import { DateUtils } from '../../utils/DateUtils';
import { VideoCall } from '../../components/VideoCall';
import { useSocket } from '../../hooks/useSocket';
import Pagination from '../../components/common/Pagination';

interface Appointment {
  _id: string;
  patientId: { _id: string; name: string; profilePicture?: string };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

const ITEMS_PER_PAGE = 4;

const DoctorAppointments: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    appointments = [],
    totalItems,
    error,
  } = useAppSelector((state) => state.doctors);
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [videoCallModal, setVideoCallModal] = useState<{
    appointment: Appointment;
    isInitiator: boolean;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { emit } = useSocket(user?._id, {
    onVideoCallDeclined: (data: { appointmentId: string; from: string }) => {
      if (
        videoCallModal &&
        data.appointmentId === videoCallModal.appointment._id
      ) {
        toast.info(
          `Video call declined by ${videoCallModal.appointment.patientId.name}`
        );
        setVideoCallModal(null);
      }
    },
    onCallAccepted: (data: {
      receiver: string;
      roomId: string;
      appointmentId: string;
    }) => {
      if (data.appointmentId === videoCallModal?.appointment._id) {
        setVideoCallModal((prev) => prev);
      }
    },
    onCallEnded: () => {
      setVideoCallModal(null);
      toast.info('Video call ended');
    },
    onIncomingCall: ({ caller, appointmentId }) => {
      const appointment = appointments.find(
        (appt) => appt._id === appointmentId
      );
      if (appointment && caller === appointment.patientId._id) {
        setVideoCallModal({ appointment, isInitiator: false });
        toast.info(`Incoming video call from ${appointment.patientId.name}`);
      }
    },
  });

  useEffect(() => {
    if (user?.role === 'doctor') {
      dispatch(
        getAppointmentsThunk({ page: currentPage, limit: ITEMS_PER_PAGE })
      );
    }
  }, [dispatch, user?.role, currentPage]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleStartVideoCall = (appointment: Appointment) => {
    const now = new Date();
    const startTime = new Date(
      `${appointment.date.split('T')[0]}T${appointment.startTime}`
    );
    const endTime = new Date(
      `${appointment.date.split('T')[0]}T${appointment.endTime}`
    );
    if (now < startTime || now > endTime || appointment.status !== 'pending') {
      toast.error('Video calls are only available during the appointment time');
      return;
    }
    if (!user?._id) {
      toast.error('User not authenticated');
      return;
    }
    emit('startCall', {
      caller: user._id,
      receiver: appointment.patientId._id,
      appointmentId: appointment._id,
    });
    setVideoCallModal({ appointment, isInitiator: true });
  };

  const handleOpenChat = (patientId: string) => {
    navigate(`/doctor/messages?thread=${patientId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewPatient = (patientId: string) => {
    navigate(`/doctor/patient/${patientId}`);
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

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      {videoCallModal && (
        <VideoCall
          appointment={videoCallModal.appointment}
          isInitiator={videoCallModal.isInitiator}
          onClose={() => setVideoCallModal(null)}
        />
      )}
      <div className="bg-white/10 backdrop-blur-lg p-4 sm:p-6 rounded-2xl border border-white/20 shadow-xl">
        <h2 className="text-xl sm:text-2xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
          Appointments
        </h2>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search appointments..."
            className="w-full sm:w-1/3 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white/20 backdrop-blur-lg border border-white/20 rounded-lg">
            <thead>
              <tr className="bg-white/10 border-bottom border-white/20">
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
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
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-white">
                      <button
                        onClick={() => handleViewPatient(appt.patientId._id)}
                        className="hover:underline hover:text-blue-300 focus:outline-none"
                      />
                      {appt.patientId.name || 'N/A'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {DateUtils.formatToLocal(appt.date)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {DateUtils.formatTimeToLocal(appt.startTime)} -{' '}
                      {DateUtils.formatTimeToLocal(appt.endTime)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
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
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-white">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenChat(appt.patientId._id)}
                          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
                          title="Chat with Patient"
                        >
                          <MessageSquare className="w-5 h-5 text-white" />
                        </button>
                        <button
                          onClick={() => handleStartVideoCall(appt)}
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
                    className="px-4 sm:px-6 py-4 text-center text-gray-200"
                  >
                    No appointments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            className="mt-6"
          />
        )}
      </div>
    </>
  );
};

export default DoctorAppointments;
