import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { getAppointmentsThunk } from '../../redux/thunks/doctorThunk';

const DoctorAppointments: React.FC = () => {
  const dispatch = useAppDispatch();
  const { appointments = [], } = useAppSelector((state) => state.doctors);
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.role === 'doctor') {
      dispatch(getAppointmentsThunk());
    }
  }, [dispatch, user?.role]);

  const filteredAppointments = Array.isArray(appointments)
    ? appointments.filter(
        (appt) =>
          appt.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          new Date(appt.date).toLocaleDateString().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
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
              <tr className="bg-white/10 border-b border-white/20">
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">Patient</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">Date</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">Time</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appt) => (
                  <tr key={appt._id} className="hover:bg-white/30 transition-all duration-300">
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">{appt.patientName || 'N/A'}</td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-200">{new Date(appt.date).toLocaleDateString()}</td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-200">{appt.startTime} - {appt.endTime}</td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appt.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                          appt.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {appt.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 md:px-6 py-4 text-center text-gray-200">No appointments found.</td>
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