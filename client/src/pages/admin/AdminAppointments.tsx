import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  getAllAppointmentsThunk,
  cancelAppointmentThunk,
} from '../../redux/thunks/adminThunk';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import { Appointment } from '../../types/authTypes';
import { toast } from 'react-toastify';

const AdminAppointments: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    appointments = [],
    loading,
    error,
    totalPages: totalPagesFromState,
  } = useAppSelector((state) => state.admin);
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (user?.role === 'admin') {
      dispatch(
        getAllAppointmentsThunk({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
        })
      );
    }
  }, [dispatch, user?.role, currentPage, searchTerm]);

  useEffect(() => {
    setTotalPages(totalPagesFromState.appointments);
  }, [totalPagesFromState.appointments]);

  const handleCancelAppointment = useCallback(
    async (appointment: Appointment) => {
      if (window.confirm('Are you sure you want to cancel this appointment?')) {
        try {
          await dispatch(cancelAppointmentThunk(appointment._id)).unwrap();
          toast.success('Appointment cancelled successfully');
        } catch (err) {
          toast.error(`Failed to cancel appointment: ${err}`);
        }
      }
    },
    [dispatch]
  );

  const columns = useMemo(
    () => [
      {
        header: 'Patient',
        accessor: (appt: Appointment): React.ReactNode =>
          appt.patientName || 'N/A',
      },
      {
        header: 'Doctor',
        accessor: (appt: Appointment): React.ReactNode =>
          appt.doctorName || 'N/A',
      },
      {
        header: 'Date',
        accessor: (appt: Appointment): React.ReactNode =>
          appt.date ? new Date(appt.date).toLocaleDateString() : 'N/A',
      },
      {
        header: 'Time',
        accessor: (appt: Appointment): React.ReactNode =>
          appt.startTime && appt.endTime
            ? `${appt.startTime} - ${appt.endTime}`
            : 'N/A',
      },
      {
        header: 'Status',
        accessor: (appt: Appointment): React.ReactNode => (
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              appt.status === 'confirmed'
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
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        label: 'Cancel',
        onClick: handleCancelAppointment,
        className: 'bg-red-600 hover:bg-red-700',
        condition: (appt: Appointment) => appt.status !== 'cancelled',
      },
    ],
    [handleCancelAppointment]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-lg p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl">
      <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
        All Appointments
      </h2>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <SearchBar
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search by patient, doctor, or date..."
        />
      </div>
      <DataTable
        data={appointments}
        columns={columns}
        actions={actions}
        isLoading={loading}
        error={error}
        onRetry={() =>
          dispatch(
            getAllAppointmentsThunk({
              page: currentPage,
              limit: itemsPerPage,
              search: searchTerm,
            })
          )
        }
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default AdminAppointments;
