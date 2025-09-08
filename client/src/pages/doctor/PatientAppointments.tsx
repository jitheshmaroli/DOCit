import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { getPatientAppointmentsThunk } from '../../redux/thunks/doctorThunk';
import { Appointment } from '../../types/authTypes';
import DataTable, { Column } from '../../components/common/DataTable';
import { DateUtils } from '../../utils/DateUtils';
import Pagination from '../../components/common/Pagination';

const ITEMS_PER_PAGE = 5;

interface PatientAppointmentsResponse {
  appointments: Appointment[];
  totalItems: number;
}

const PatientAppointments: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { plans, loading } = useAppSelector((state) => state.doctors);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const doctorId = plans[0]?.doctorId;

  useEffect(() => {
    if (patientId && doctorId) {
      dispatch(
        getPatientAppointmentsThunk({
          patientId,
          doctorId,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
        })
      ).then((result) => {
        if (getPatientAppointmentsThunk.fulfilled.match(result)) {
          const { appointments, totalItems } =
            result.payload as PatientAppointmentsResponse;
          setAppointments(appointments);
          setTotalItems(totalItems);
        } else {
          toast.error('Failed to fetch appointments');
        }
      });
    }
  }, [dispatch, patientId, doctorId, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const appointmentColumns: Column<Appointment>[] = [
    {
      header: 'Date',
      accessor: (appointment) => DateUtils.formatToLocal(appointment.date),
    },
    {
      header: 'Time',
      accessor: (appointment) =>
        `${DateUtils.formatTimeToLocal(appointment.startTime)} - ${DateUtils.formatTimeToLocal(
          appointment.endTime
        )}`,
    },
    {
      header: 'Status',
      accessor: (appointment) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            appointment.status === 'completed'
              ? 'bg-green-500/20 text-green-300'
              : appointment.status === 'pending'
                ? 'bg-yellow-500/20 text-yellow-300'
                : 'bg-red-500/20 text-red-300'
          }`}
        >
          {appointment.status.charAt(0).toUpperCase() +
            appointment.status.slice(1)}
        </span>
      ),
    },
    {
      header: 'Details',
      accessor: (appointment) => (
        <button
          onClick={() => navigate(`/doctor/appointment/${appointment._id}`)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
        >
          View Details
        </button>
      ),
    },
  ];

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8">
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-white hover:text-blue-300 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h2 className="text-xl sm:text-2xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
            Patient Appointments
          </h2>
          <div className="space-y-6">
            <DataTable
              data={appointments}
              columns={appointmentColumns}
              isLoading={loading}
              emptyMessage="No appointments found for this patient."
            />
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                className="mt-6"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientAppointments;
