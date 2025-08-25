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
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleViewDetails = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  }, []);

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
        label: 'View Details',
        onClick: handleViewDetails,
        className: 'bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg',
      },
      {
        label: 'Cancel',
        onClick: handleCancelAppointment,
        className: 'bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg',
        condition: (appt: Appointment) => appt.status !== 'cancelled',
      },
    ],
    [handleCancelAppointment, handleViewDetails]
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
      { value: 'date:asc', label: 'Date (Earliest First)' },
      { value: 'date:desc', label: 'Date (Latest First)' },
    ],
    []
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-lg p-4 sm:p-6 lg:p-8 rounded-2xl border border-white/20 shadow-xl">
      <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
        All Appointments
      </h2>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <SearchBar
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search by patient or doctor..."
        />
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <FilterSelect
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
            label="Status"
            className="w-full sm:w-48"
          />
          <FilterSelect
            value={sortFilter}
            options={sortOptions}
            onChange={setSortFilter}
            label="Sort By"
            className="w-full sm:w-48"
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
          dispatch(getAllAppointmentsThunk(params));
        }}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Appointment Details"
      >
        {selectedAppointment && (
          <div className="text-white space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-purple-300 mb-2">
                  General Information
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Patient Name:</span>
                    <span>{selectedAppointment.patientId?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Doctor Name:</span>
                    <span>{selectedAppointment.doctorId?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Booking Type:</span>
                    <span>
                      {selectedAppointment.isFreeBooking ? 'Free' : 'Paid'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Status:</span>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedAppointment.status === 'completed'
                          ? 'bg-green-500/20 text-green-300'
                          : selectedAppointment.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {selectedAppointment.status || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-purple-300 mb-2">
                  Schedule
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Date:</span>
                    <span>
                      {selectedAppointment.date
                        ? new Date(
                            selectedAppointment.date
                          ).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Time:</span>
                    <span>
                      {selectedAppointment.startTime &&
                      selectedAppointment.endTime
                        ? `${selectedAppointment.startTime} - ${selectedAppointment.endTime}`
                        : 'N/A'}
                    </span>
                  </div>
                  {/* <div className="flex justify-between">
                    <span className="text-gray-300">Booking Time:</span>
                    <span>
                      {selectedAppointment.createdAt
                        ? new Date(
                            selectedAppointment.createdAt
                          ).toLocaleString()
                        : 'N/A'}
                    </span>
                  </div> */}
                </div>
              </div>

              {selectedAppointment.cancellationReason && (
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-purple-300 mb-2">
                    Cancellation Details
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Reason:</span>
                      <span>{selectedAppointment.cancellationReason}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedAppointment.prescriptionId && (
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-purple-300 mb-2">
                    Prescription Details
                  </h4>
                  <div className="space-y-2">
                    {typeof selectedAppointment.prescriptionId === 'string' ? (
                      <div className="flex justify-between">
                        <span className="text-gray-300">Prescription ID:</span>
                        <span>{selectedAppointment.prescriptionId}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Medications:</span>
                          <span>
                            {selectedAppointment.prescriptionId.medications
                              ?.map(
                                (med) =>
                                  `${med.name} (${med.dosage}, ${med.frequency}, ${med.duration})`
                              )
                              .join('; ') || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Notes:</span>
                          <span>
                            {selectedAppointment.prescriptionId.notes || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Issued:</span>
                          <span>
                            {selectedAppointment.prescriptionId.createdAt
                              ? new Date(
                                  selectedAppointment.prescriptionId.createdAt
                                ).toLocaleString()
                              : 'N/A'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-purple-300 mb-2">
                  Additional Information
                </h4>
                <div className="space-y-2">
                  {/* <div className="flex justify-between">
                    <span className="text-gray-300">Reminder Sent:</span>
                    <span>
                      {selectedAppointment.reminderSent ? 'Yes' : 'No'}
                    </span>
                  </div> */}
                  <div className="flex justify-between">
                    <span className="text-gray-300">Has Review:</span>
                    <span>{selectedAppointment.hasReview ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminAppointments;
