/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { getPaginatedPatientAppointmentsThunk } from '../../redux/thunks/patientThunk';
import { Appointment } from '../../types/authTypes';
import DataTable, { Column } from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import FilterSelect from '../../components/common/FilterSelect';
import Pagination from '../../components/common/Pagination';
import Avatar from '../../components/common/Avatar';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, FileText, Eye } from 'lucide-react';
import { DateUtils } from '../../utils/DateUtils';
import ROUTES from '../../constants/routeConstants';
import { showError } from '../../utils/toastConfig';
import PrescriptionModal from '../../components/PrescriptionModal';

const MedicalHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const patientState = useAppSelector((state) => state.patient);
  const { user } = useAppSelector((state) => state.auth);

  const {
    appointments: rawAppointments,
    totalItems,
    loading,
    error,
  } = patientState;

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const allAppointments = useMemo(() => {
    if (Array.isArray(rawAppointments)) {
      return rawAppointments;
    }
    if (rawAppointments && typeof rawAppointments === 'object') {
      return Object.values(rawAppointments).flat() as Appointment[];
    }
    return [] as Appointment[];
  }, [rawAppointments]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handleDateFromChange = useCallback((value: string) => {
    setDateFrom(value);
    setPage(1);
  }, []);

  const handleDateToChange = useCallback((value: string) => {
    setDateTo(value);
    setPage(1);
  }, []);

  useEffect(() => {
    if (!user?._id) {
      showError('Please log in to view medical history');
      navigate(ROUTES.PUBLIC.LOGIN);
      return;
    }

    const params = {
      page,
      limit,
      status: statusFilter || undefined,
      search: searchTerm || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy: 'date',
      sortOrder: 'desc' as const,
    };

    dispatch(getPaginatedPatientAppointmentsThunk(params));
  }, [
    dispatch,
    user?._id,
    page,
    limit,
    statusFilter,
    searchTerm,
    dateFrom,
    dateTo,
    navigate,
  ]);

  const columns: Column<Appointment>[] = [
    {
      header: 'Appointment Date',
      accessor: (item) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-300" />
          <span>{DateUtils.formatToLocal(item.date)}</span>
        </div>
      ),
    },
    {
      header: 'Appointment Time',
      accessor: (appt: Appointment): React.ReactNode =>
        appt.startTime && appt.endTime
          ? `${DateUtils.formatTimeToLocal(appt.startTime)} - ${DateUtils.formatTimeToLocal(appt.endTime)}`
          : 'N/A',
    },
    {
      header: 'Doctor',
      accessor: (item) => (
        <div className="flex items-center gap-2">
          <Avatar
            name={item.doctorName || 'Unknown'}
            id={
              (typeof item.doctorId === 'string'
                ? item.doctorId
                : item.doctorId?._id || '') as string
            }
            profilePicture={item.doctorProfilePicture}
          />
          <span>{item.doctorName || 'Unknown'}</span>
        </div>
      ),
    },
    {
      header: 'Appointment Status',
      accessor: (item) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            item.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : item.status === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (item) => (
        <div className="flex gap-2">
          {item.prescription && (
            <button
              onClick={() => {
                setSelectedPrescription(item.prescription);
                setIsModalOpen(true);
              }}
              className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
              title="View Prescription"
              aria-label="View Prescription"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}
          <Link
            to={`${ROUTES.PATIENT.APPOINTMENT_DETAILS.replace(':appointmentId', item._id)}`}
            className="p-1 text-purple-400 hover:text-purple-300 transition-colors"
            title="View Details"
            aria-label="View Appointment Details"
          >
            <Eye className="w-4 h-4" />
          </Link>
        </div>
      ),
    },
  ];

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const statusOptions = [
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'pending', label: 'Pending' },
    { value: '', label: 'All' },
  ];

  const totalPages = Math.ceil((totalItems || 0) / limit);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
            Medical History
          </h2>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-white/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center flex-wrap">
            <SearchBar
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by doctor name..."
              debounceDelay={300}
            />
            <FilterSelect
              value={statusFilter}
              options={statusOptions}
              onChange={handleStatusChange}
            />
            {/* Date Range Filter */}
            <div className="flex gap-2 items-center">
              <label className="text-sm text-gray-200">Date From:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="p-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-sm text-gray-200">Date To:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="p-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <DataTable
          data={allAppointments}
          columns={columns}
          isLoading={loading}
          error={error}
          emptyMessage="No appointments found."
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      <PrescriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        prescription={selectedPrescription}
      />
    </div>
  );
};

export default MedicalHistory;
