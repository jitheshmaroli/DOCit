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
import {
  Calendar,
  FileText,
  Eye,
  Filter,
  X,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { DateUtils } from '../../utils/DateUtils';
import ROUTES from '../../constants/routeConstants';
import { showError } from '../../utils/toastConfig';
import PrescriptionModal from '../../components/PrescriptionModal';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
];

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    completed: {
      cls: 'bg-emerald-100 text-emerald-700',
      icon: <CheckCircle size={10} />,
    },
    pending: { cls: 'bg-amber-100 text-amber-700', icon: <Clock size={10} /> },
    cancelled: { cls: 'bg-red-100 text-red-700', icon: <XCircle size={10} /> },
  };
  const { cls, icon } = map[status] || {
    cls: 'bg-surface-muted text-text-muted',
    icon: null,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}
    >
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const MedicalHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    appointments: rawAppointments,
    totalItems,
    loading,
    error,
  } = useAppSelector((s) => s.patient);
  const { user } = useAppSelector((s) => s.auth);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const allAppointments = useMemo(() => {
    if (Array.isArray(rawAppointments)) return rawAppointments;
    if (rawAppointments && typeof rawAppointments === 'object')
      return Object.values(rawAppointments).flat() as Appointment[];
    return [] as Appointment[];
  }, [rawAppointments]);

  const hasActiveFilters = statusFilter || dateFrom || dateTo;

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
  }, []);
  const handleStatus = useCallback((val: string) => {
    setStatusFilter(val);
    setPage(1);
  }, []);
  const handleDateFrom = useCallback((val: string) => {
    setDateFrom(val);
    setPage(1);
  }, []);
  const handleDateTo = useCallback((val: string) => {
    setDateTo(val);
    setPage(1);
  }, []);
  const clearFilters = () => {
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  useEffect(() => {
    if (!user?._id) {
      showError('Please log in to view medical history');
      navigate(ROUTES.PUBLIC.LOGIN);
      return;
    }
    dispatch(
      getPaginatedPatientAppointmentsThunk({
        page,
        limit,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy: 'date',
        sortOrder: 'desc' as const,
      })
    );
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
      header: 'Date',
      accessor: (item) => (
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-primary-400 flex-shrink-0" />
          <span className="text-sm text-text-primary font-medium">
            {DateUtils.formatToLocal(item.date)}
          </span>
        </div>
      ),
    },
    {
      header: 'Time',
      accessor: (appt) =>
        appt.startTime && appt.endTime ? (
          <span className="text-sm text-text-secondary">
            {DateUtils.formatTimeToLocal(appt.startTime)} –{' '}
            {DateUtils.formatTimeToLocal(appt.endTime)}
          </span>
        ) : (
          <span className="text-text-muted text-sm">N/A</span>
        ),
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
          <span className="text-sm font-medium text-text-primary">
            {item.doctorName || 'Unknown'}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (item) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Actions',
      accessor: (item) => (
        <div className="flex items-center gap-1.5">
          {item.prescription && (
            <button
              onClick={() => {
                setSelectedPrescription(item.prescription);
                setIsModalOpen(true);
              }}
              className="p-2 rounded-xl border border-surface-border text-primary-500 hover:bg-primary-50 hover:border-primary-200 transition-all duration-150"
              title="View Prescription"
              aria-label="View Prescription"
            >
              <FileText size={15} />
            </button>
          )}
          <Link
            to={`${ROUTES.PATIENT.APPOINTMENT_DETAILS.replace(':appointmentId', item._id)}`}
            className="p-2 rounded-xl border border-surface-border text-text-secondary hover:bg-surface-muted hover:border-surface-border transition-all duration-150"
            title="View Details"
            aria-label="View Appointment Details"
          >
            <Eye size={15} />
          </Link>
        </div>
      ),
    },
  ];

  const totalPages = Math.ceil((totalItems || 0) / limit);

  return (
    <div className="animate-fade-in">
      {/* ── Page header ── */}
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Medical History</h1>
          <p className="page-subtitle">
            View your past and upcoming appointments
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-48">
            <SearchBar
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by doctor name..."
              debounceDelay={300}
            />
          </div>

          {/* Status filter */}
          <div className="w-44">
            <FilterSelect
              value={statusFilter}
              options={statusOptions}
              onChange={handleStatus}
            />
          </div>

          {/* Date from */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-text-muted whitespace-nowrap">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateFrom(e.target.value)}
              className="input py-2 text-sm w-36"
            />
          </div>

          {/* Date to */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-text-muted whitespace-nowrap">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleDateTo(e.target.value)}
              className="input py-2 text-sm w-36"
            />
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn-ghost text-sm flex items-center gap-1.5 text-error hover:bg-red-50"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-surface-border">
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Filter size={11} /> Active filters:
            </span>
            {statusFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full border border-primary-100 font-medium">
                Status: {statusFilter}
                <button
                  onClick={() => handleStatus('')}
                  className="hover:text-primary-900 ml-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            )}
            {dateFrom && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full border border-primary-100 font-medium">
                From: {dateFrom}
                <button
                  onClick={() => handleDateFrom('')}
                  className="hover:text-primary-900 ml-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            )}
            {dateTo && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full border border-primary-100 font-medium">
                To: {dateTo}
                <button
                  onClick={() => handleDateTo('')}
                  className="hover:text-primary-900 ml-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden mb-5">
        <DataTable
          data={allAppointments}
          columns={columns}
          isLoading={loading}
          error={error}
          emptyMessage="No appointments found."
        />
      </div>

      {/* ── Pagination ── */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* ── Prescription modal ── */}
      <PrescriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        prescription={selectedPrescription}
      />
    </div>
  );
};

export default MedicalHistory;
