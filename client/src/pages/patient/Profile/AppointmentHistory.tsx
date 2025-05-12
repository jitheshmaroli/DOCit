import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Appointment {
  _id: string;
  doctor: string;
  date: string;
  time: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
}

const AppointmentHistory = ({ patientId }: { patientId: string }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/patients/${patientId}/appointments`,
          { withCredentials: true }
        );
        setAppointments(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        toast.error('Failed to load appointments', {
          position: 'bottom-right',
          autoClose: 3000,
        });
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [patientId]);

  if (loading) {
    return <div className="text-white">Loading appointments...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <ToastContainer position="bottom-right" />
      <h2 className="text-lg font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
        Appointment History
      </h2>
      {appointments.length === 0 ? (
        <div className="text-gray-200">No appointments found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/20">
                <th className="py-3 px-4 text-gray-200">Doctor</th>
                <th className="py-3 px-4 text-gray-200">Date</th>
                <th className="py-3 px-4 text-gray-200">Time</th>
                <th className="py-3 px-4 text-gray-200">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr
                  key={appointment._id}
                  className="border-b border-white/10 hover:bg-white/20 transition-all duration-300"
                >
                  <td className="py-3 px-4 text-white">{appointment.doctor}</td>
                  <td className="py-3 px-4 text-white">
                    {new Date(appointment.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-white">{appointment.time}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        appointment.status === 'Upcoming'
                          ? 'bg-blue-500/20 text-blue-300'
                          : appointment.status === 'Completed'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AppointmentHistory;