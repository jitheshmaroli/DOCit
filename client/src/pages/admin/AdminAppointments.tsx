import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  getAllAppointmentsThunk,
  cancelAppointmentThunk,
} from '../../redux/thunks/adminThunk';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import FilterSelect from '../../components/common/FilterSelect';
import Pagination from '../../components/common/Pagination';
import { Appointment, PaginationParams } from '../../types/authTypes';
import { toast } from 'react-toastify';

const ITEMS_PER_PAGE = 5;

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
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('createdAt:desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (user?.role === 'admin') {
      const [sortBy, sortOrder] = sortFilter.split(':') as [
        string,
        'asc' | 'desc',
      ];
      const params: PaginationParams = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchTerm || undefined,
        sortBy,
        sortOrder,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      console.log('Dispatching getAllAppointmentsThunk with params:', params); // Debug log
      dispatch(getAllAppointmentsThunk(params));
    }
  }, [dispatch, user?.role, currentPage, searchTerm, statusFilter, sortFilter]);

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
          appt.patientId?.name || 'N/A',
      },
      {
        header: 'Doctor',
        accessor: (appt: Appointment): React.ReactNode =>
          appt.doctorId?.name || 'N/A',
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

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'All Statuses' },
      { value: 'pending', label: 'Pending' },
      { value: 'completed', label: 'completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
    []
  );

  const sortOptions = useMemo(
    () => [
      { value: 'createdAt:desc', label: 'Newest First' },
      { value: 'createdAt:asc', label: 'Oldest First' },
      { value: 'date:asc', label: 'Date (Earliest First)' },
      { value: 'date:desc', label: 'Date (Latest First)' },
    ],
    []
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearch = useCallback((term: string) => {
    console.log('Search Term:', term);
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-lg p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl">
      <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
        All Appointments
      </h2>
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <SearchBar
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search by patient or doctor..."
        />
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          <FilterSelect
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
            label="Status"
          />
          <FilterSelect
            value={sortFilter}
            options={sortOptions}
            onChange={setSortFilter}
            label="Sort By"
          />
        </div>
      </div>
      <DataTable
        data={appointments}
        columns={columns}
        actions={actions}
        isLoading={loading}
        error={error}
        onRetry={() => {
          const [sortBy, sortOrder] = sortFilter.split(':') as [
            string,
            'asc' | 'desc',
          ];
          const params: PaginationParams = {
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            search: searchTerm || undefined,
            sortBy,
            sortOrder,
            status: statusFilter !== 'all' ? statusFilter : undefined,
          };

          console.log('Retrying getAllAppointmentsThunk with params:', params); // Debug log
          dispatch(getAllAppointmentsThunk(params));
        }}
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
