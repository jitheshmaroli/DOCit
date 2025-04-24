import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getAllAppointmentsThunk, cancelAppointmentThunk } from '../../redux/thunks/adminThunk';
import { Appointment } from '../../types/authTypes';

const AdminAppointments: React.FC = () => {
  const dispatch = useAppDispatch();
  const { appointments = [], loading, error } = useAppSelector((state) => state.admin);
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      dispatch(getAllAppointmentsThunk());
    }
  }, [dispatch, user?.role]);

  useEffect(() => {
    console.log('Redux appointments:', appointments); // Debug
  }, [appointments]);

  const handleCancelAppointment = async (appointmentId: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await dispatch(cancelAppointmentThunk(appointmentId)).unwrap();
        toast.success('Appointment cancelled successfully');
      } catch (error) {
        toast.error(`Failed to cancel appointment: ${error}`);
      }
    }
  };

  const filteredAppointments = Array.isArray(appointments)
    ? appointments.filter((appt): appt is Appointment => {
        if (!appt || !appt._id) {
          console.warn('Invalid appointment:', appt); // Debug
          return false;
        }
        const patientName = appt.patientName?.toLowerCase() || '';
        const doctorName = appt.doctorName?.toLowerCase() || '';
        const date = appt.date ? new Date(appt.date).toLocaleDateString().toLowerCase() : '';
        const search = searchTerm.toLowerCase();
        return (
          patientName.includes(search) ||
          doctorName.includes(search) ||
          date.includes(search) ||
          !search
        );
      })
    : [];

  if (loading && (!appointments || appointments.length === 0)) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-300"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border-l-4 border-red-500 p-4 rounded-lg text-white">
        <p className="text-sm">Error: {error}</p>
        <button
          onClick={() => dispatch(getAllAppointmentsThunk())}
          className="mt-2 text-sm text-purple-300 hover:text-purple-200 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="bg-white/10 backdrop-blur-lg p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl">
        <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
          All Appointments
        </h2>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by patient, doctor, or date..."
            className="w-full md:w-1/3 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white/20 backdrop-blur-lg border border-white/20 rounded-lg">
            <thead>
              <tr className="bg-white/10 border-b border-white/20">
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Doctor
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
                      {appt.patientName || 'N/A'}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">
                      {appt.doctorName || 'N/A'}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {appt.date ? new Date(appt.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {appt.startTime && appt.endTime
                        ? `${appt.startTime} - ${appt.endTime}`
                        : 'N/A'}
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
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                      {appt.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancelAppointment(appt._id)}
                          className="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
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

export default AdminAppointments;