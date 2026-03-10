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
import Modal from '../../components/common/Modal';
import { Appointment, PaginationParams } from '../../types/authTypes';
import { ITEMS_PER_PAGE } from '../../utils/constants';
import { showSuccess, showError } from '../../utils/toastConfig';
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';

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
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [showFullNotes, setShowFullNotes] = useState(false);

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
      if (statusFilter !== 'all') params.status = statusFilter;
      dispatch(getAllAppointmentsThunk(params));
    }
  }, [dispatch, user?.role, currentPage, searchTerm, statusFilter, sortFilter]);

  useEffect(() => {
    setTotalPages(totalPagesFromState.appointments);
  }, [totalPagesFromState.appointments]);

  const handleCancelAppointment = useCallback(async () => {
    if (!selectedAppointment) return;
    try {
      await dispatch(cancelAppointmentThunk(selectedAppointment._id)).unwrap();
      showSuccess('Appointment cancelled successfully');
      setIsCancelModalOpen(false);
      setSelectedAppointment(null);
    } catch (err) {
      showError(`Failed to cancel appointment: ${err}`);
    }
  }, [dispatch, selectedAppointment]);

  const handleViewDetails = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
    setShowFullNotes(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
    setShowFullNotes(false);
  }, []);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: 'badge badge-success',
      pending: 'badge badge-warning',
      cancelled: 'badge badge-error',
    };
    return map[status] || 'badge badge-neutral';
  };

  const columns = useMemo(
    () => [
      {
        header: 'Patient',
        accessor: (appt: Appointment): React.ReactNode => (
          <span className="font-medium text-text-primary">
            {appt.patientName || 'N/A'}
          </span>
        ),
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
            ? `${appt.startTime} – ${appt.endTime}`
            : 'N/A',
      },
      {
        header: 'Status',
        accessor: (appt: Appointment): React.ReactNode => (
          <span className={statusBadge(appt.status)}>
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
        label: 'View Details',
        onClick: handleViewDetails,
        className: 'btn-secondary text-xs px-3 py-1.5',
      },
      {
        label: 'Cancel',
        onClick: (appointment: Appointment) => {
          setSelectedAppointment(appointment);
          setIsCancelModalOpen(true);
        },
        className: 'btn-danger text-xs px-3 py-1.5',
        condition: (appt: Appointment) => appt.status === 'pending',
      },
    ],
    [handleViewDetails]
  );

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'All Statuses' },
      { value: 'pending', label: 'Pending' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
    []
  );

  const sortOptions = useMemo(
    () => [
      { value: 'createdAt:desc', label: 'Newest First' },
      { value: 'createdAt:asc', label: 'Oldest First' },
      { value: 'date:asc', label: 'Date (Earliest)' },
      { value: 'date:desc', label: 'Date (Latest)' },
    ],
    []
  );

  const handlePageChange = useCallback(
    (page: number) => setCurrentPage(page),
    []
  );
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  // Detail row helper
  const DetailRow = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex justify-between items-start gap-4 py-1.5">
      <span className="text-xs text-text-muted flex-shrink-0 w-32">
        {label}
      </span>
      <span className="text-xs text-text-primary text-right break-words">
        {value}
      </span>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
            <CalendarDays size={18} className="text-primary-600" />
          </div>
          <div>
            <h1 className="page-title">All Appointments</h1>
            <p className="page-subtitle">
              View and manage all patient appointments
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <SearchBar
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search by patient or doctor..."
          />
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <FilterSelect
              value={statusFilter}
              options={statusOptions}
              onChange={setStatusFilter}
              label="Status"
              className="w-full sm:w-44"
            />
            <FilterSelect
              value={sortFilter}
              options={sortOptions}
              onChange={setSortFilter}
              label="Sort By"
              className="w-full sm:w-44"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
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
            dispatch(getAllAppointmentsThunk(params));
          }}
        />
        <div className="border-t border-surface-border px-4 py-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* View Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Appointment Details"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            {/* General Info */}
            <div className="bg-surface-bg rounded-xl p-4 border border-surface-border">
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-3">
                General Information
              </p>
              <DetailRow
                label="Patient Name"
                value={selectedAppointment.patientName || 'N/A'}
              />
              <DetailRow
                label="Doctor Name"
                value={selectedAppointment.doctorName || 'N/A'}
              />
              <DetailRow
                label="Booking Type"
                value={selectedAppointment.isFreeBooking ? 'Free' : 'Paid'}
              />
              <DetailRow
                label="Status"
                value={
                  <span className={statusBadge(selectedAppointment.status)}>
                    {selectedAppointment.status || 'Pending'}
                  </span>
                }
              />
            </div>

            {/* Schedule */}
            <div className="bg-surface-bg rounded-xl p-4 border border-surface-border">
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-3">
                Schedule
              </p>
              <DetailRow
                label="Date"
                value={
                  selectedAppointment.date
                    ? new Date(selectedAppointment.date).toLocaleDateString()
                    : 'N/A'
                }
              />
              <DetailRow
                label="Time"
                value={
                  selectedAppointment.startTime && selectedAppointment.endTime
                    ? `${selectedAppointment.startTime} – ${selectedAppointment.endTime}`
                    : 'N/A'
                }
              />
            </div>

            {/* Cancellation */}
            {selectedAppointment.cancellationReason && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-3">
                  Cancellation Details
                </p>
                <DetailRow
                  label="Reason"
                  value={selectedAppointment.cancellationReason}
                />
              </div>
            )}

            {/* Prescription */}
            {selectedAppointment.prescriptionId && (
              <div className="bg-surface-bg rounded-xl p-4 border border-surface-border">
                <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-3">
                  Prescription Details
                </p>
                {typeof selectedAppointment.prescriptionId === 'string' ? (
                  <DetailRow
                    label="Prescription ID"
                    value={selectedAppointment.prescriptionId}
                  />
                ) : (
                  <>
                    <DetailRow
                      label="Medications"
                      value={
                        selectedAppointment.prescriptionId.medications
                          ?.map(
                            (med) =>
                              `${med.name} (${med.dosage}, ${med.frequency}, ${med.duration})`
                          )
                          .join('; ') || 'N/A'
                      }
                    />
                    <div className="py-1.5">
                      <p className="text-xs text-text-muted mb-1">Notes</p>
                      <p className="text-xs text-text-primary">
                        {selectedAppointment.prescriptionId.notes
                          ? showFullNotes
                            ? selectedAppointment.prescriptionId.notes
                            : selectedAppointment.prescriptionId.notes.length >
                                100
                              ? `${selectedAppointment.prescriptionId.notes.substring(0, 100)}...`
                              : selectedAppointment.prescriptionId.notes
                          : 'N/A'}
                      </p>
                      {selectedAppointment.prescriptionId.notes &&
                        selectedAppointment.prescriptionId.notes.length >
                          100 && (
                          <button
                            onClick={() => setShowFullNotes(!showFullNotes)}
                            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-1.5 font-medium"
                          >
                            {showFullNotes ? (
                              <>
                                <ChevronUp size={13} /> Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown size={13} /> Show More
                              </>
                            )}
                          </button>
                        )}
                    </div>
                    <DetailRow
                      label="Issued"
                      value={
                        selectedAppointment.prescriptionId.createdAt
                          ? new Date(
                              selectedAppointment.prescriptionId.createdAt
                            ).toLocaleString()
                          : 'N/A'
                      }
                    />
                  </>
                )}
              </div>
            )}

            {/* Additional */}
            <div className="bg-surface-bg rounded-xl p-4 border border-surface-border">
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-3">
                Additional Information
              </p>
              <DetailRow
                label="Has Review"
                value={selectedAppointment.hasReview ? 'Yes' : 'No'}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Confirm Modal */}
      {isCancelModalOpen && selectedAppointment && (
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => {
            setIsCancelModalOpen(false);
            setSelectedAppointment(null);
          }}
          title="Cancel Appointment"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setSelectedAppointment(null);
                }}
                className="btn-secondary"
              >
                Keep Appointment
              </button>
              <button onClick={handleCancelAppointment} className="btn-danger">
                Yes, Cancel
              </button>
            </div>
          }
        >
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary mb-1">
                Are you sure?
              </p>
              <p className="text-sm text-text-secondary">
                This will cancel the appointment for{' '}
                <span className="font-semibold text-text-primary">
                  {selectedAppointment.patientName}
                </span>{' '}
                with{' '}
                <span className="font-semibold text-text-primary">
                  {selectedAppointment.doctorName}
                </span>
                . This action cannot be undone.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminAppointments;
