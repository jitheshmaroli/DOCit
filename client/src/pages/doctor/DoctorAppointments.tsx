import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { getAppointmentsThunk } from '../../redux/thunks/doctorThunk';
import { Patient } from '../../types/authTypes';

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

  useEffect(() => {
    if (user?.role === 'doctor') {
      dispatch(getAppointmentsThunk());
    }
  }, [dispatch, user?.role]);

  const filteredAppointments = Array.isArray(appointments)
    ? appointments.filter(
        (appt) =>
          appt.patientId?.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          new Date(appt.date)
            .toLocaleDateString()
            .includes(searchTerm.toLowerCase())
      )
    : [];

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />

      {/* Patient Details Modal */}
      <PatientDetailsModal
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />

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
                        onClick={() => handlePatientClick(appt.patientId)}
                        className="hover:underline hover:text-blue-300 focus:outline-none"
                      >
                        {appt.patientId.name || 'N/A'}
                      </button>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {new Date(appt.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {appt.startTime} - {appt.endTime}
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
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
