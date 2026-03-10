import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { getAppointmentsThunk } from '../../redux/thunks/doctorThunk';
import { DateUtils } from '../../utils/DateUtils';
import Pagination from '../../components/common/Pagination';
import DataTable, { Column } from '../../components/common/DataTable';
import { Appointment } from '../../types/authTypes';
import { ITEMS_PER_PAGE } from '../../utils/constants';
import ROUTES from '../../constants/routeConstants';
import { Search, Calendar } from 'lucide-react';

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || 'badge-neutral'}`}
    >
      {status || 'Pending'}
    </span>
  );
};

const DoctorAppointments: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { appointments = [], totalItems } = useAppSelector(
    (state) => state.doctors
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(
      getAppointmentsThunk({ page: currentPage, limit: ITEMS_PER_PAGE })
    );
  }, [dispatch, currentPage]);

  const columns: Column<Appointment>[] = [
    {
      header: 'Patient',
      accessor: (appt) => (
        <button
          onClick={() =>
            navigate(
              ROUTES.DOCTOR.PATIENT_DETAILS.replace(
                ':patientId',
                appt.patientId._id
              ),
              { state: { from: 'appointments' } }
            )
          }
          className="font-medium text-primary-600 hover:text-primary-700 hover:underline focus:outline-none"
        >
          {appt.patientId.name || 'N/A'}
        </button>
      ),
    },
    {
      header: 'Date',
      accessor: (appt) => (
        <span className="text-text-secondary">
          {DateUtils.formatToLocal(appt.date)}
        </span>
      ),
    },
    {
      header: 'Time',
      accessor: (appt) => (
        <span className="text-text-secondary">
          {DateUtils.formatTimeToLocal(appt.startTime)} –{' '}
          {DateUtils.formatTimeToLocal(appt.endTime)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (appt) => <StatusBadge status={appt.status} />,
    },
  ];

  const actions = [
    {
      label: 'View Details',
      onClick: (appt: Appointment) =>
        navigate(
          ROUTES.DOCTOR.APPOINTMENT_DETAILS.replace(':appointmentId', appt._id)
        ),
      className: 'btn-primary text-xs px-3 py-1.5',
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
    <div className="space-y-6 animate-fade-in">
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">
            View and manage all your patient appointments
          </p>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="card overflow-hidden">
        {/* Search bar */}
        <div className="px-6 py-4 border-b border-surface-border flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by patient or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9 py-2 text-sm w-full"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Calendar size={15} />
            <span>
              {filteredAppointments.length} appointment
              {filteredAppointments.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Table */}
        <DataTable
          data={filteredAppointments}
          columns={columns}
          actions={actions}
          emptyMessage="No appointments found."
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-surface-border">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorAppointments;
