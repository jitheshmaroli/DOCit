import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { getAppointmentsThunk } from '../../redux/thunks/doctorThunk';
import { DateUtils } from '../../utils/DateUtils';
import Pagination from '../../components/common/Pagination';
import DataTable, { Column } from '../../components/common/DataTable';

interface AppointmentPatient {
  _id: string;
  name?: string;
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

interface Appointment {
  _id: string;
  patientId: AppointmentPatient;
  doctorId: AppointmentDoctor;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'completed' | 'cancelled';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(
      getAppointmentsThunk({ page: currentPage, limit: ITEMS_PER_PAGE })
    );
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const columns: Column<Appointment>[] = [
    {
      header: 'Patient',
      accessor: (appt) => (
        <button
          onClick={() => navigate(`/doctor/patient/${appt.patientId._id}`)}
          className="hover:underline hover:text-blue-300 focus:outline-none"
        >
          {appt.patientId.name || 'N/A'}
        </button>
      ),
    },
    {
      header: 'Date',
      accessor: (appt) => DateUtils.formatToLocal(appt.date),
    },
    {
      header: 'Time',
      accessor: (appt) =>
        `${DateUtils.formatTimeToLocal(appt.startTime)} - ${DateUtils.formatTimeToLocal(appt.endTime)}`,
    },
    {
      header: 'Status',
      accessor: (appt) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            appt.status === 'completed'
              ? 'bg-green-500/20 text-green-300'
              : appt.status === 'pending'
                ? 'bg-yellow-500/20 text-yellow-300'
                : 'bg-red-500/20 text-red-300'
          }`}
        >
          {appt.status || 'Pending'}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: 'View Details',
      onClick: (appt: Appointment) =>
        navigate(`/doctor/appointment/${appt._id}`),
      className: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

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
        <DataTable
          data={filteredAppointments}
          columns={columns}
          actions={actions}
          emptyMessage="No appointments found."
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
    </>
  );
};

export default DoctorAppointments;
