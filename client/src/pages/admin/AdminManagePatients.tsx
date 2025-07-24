import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  listPatientsThunk,
  createPatientThunk,
  updatePatientThunk,
  deletePatientThunk,
  blockPatientThunk,
} from '../../redux/thunks/adminThunk';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import FilterSelect from '../../components/common/FilterSelect';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Avatar from '../../components/common/Avatar';
import { Patient } from '../../types/authTypes';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/helpers';

interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isBlocked?: boolean;
  isSubscribed?: boolean;
}

interface Confirmation {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
}

interface Action {
  label: string;
  onClick: (item: Patient) => void | Promise<void>;
  className?: string;
  condition?: (item: Patient) => boolean;
}

const ITEMS_PER_PAGE = 5;

const AdminManagePatients: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    patients,
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });
  const [confirmation, setConfirmation] = useState<Confirmation>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });
  const inputRef = useRef<HTMLInputElement>(null);
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
        if (statusFilter === 'active') params.isBlocked = false;
        if (statusFilter === 'blocked') params.isBlocked = true;
        if (statusFilter === 'subscribed') params.isSubscribed = true;
        if (statusFilter === 'notSubscribed') params.isSubscribed = false;
      }

      dispatch(listPatientsThunk(params));
    }
  }, [dispatch, user?.role, currentPage, searchTerm, statusFilter, sortFilter]);

  useEffect(() => {
    setTotalPages(totalPagesFromState.patients);
  }, [totalPagesFromState.patients]);

  const handleCreatePatient = useCallback(async () => {
    try {
      await dispatch(createPatientThunk(newPatient)).unwrap();
      toast.success('Patient created successfully');
      setIsModalOpen(false);
      setNewPatient({ email: '', password: '', name: '', phone: '' });
    } catch (err) {
      toast.error(`Failed to create patient: ${err}`);
    }
  }, [dispatch, newPatient]);

  const handleUpdatePatient = useCallback(async () => {
    if (!editPatient) return;
    try {
      await dispatch(
        updatePatientThunk({ id: editPatient._id, updates: editPatient })
      ).unwrap();
      toast.success('Patient updated successfully');
      setEditPatient(null);
    } catch (err) {
      toast.error(`Failed to update patient: ${err}`);
    }
  }, [dispatch, editPatient]);

  const handleDeletePatient = useCallback(
    async (patient: Patient) => {
      setConfirmation({
        isOpen: true,
        message: `Are you sure you want to delete patient ${patient.name || 'Unknown'}?`,
        onConfirm: async () => {
          try {
            await dispatch(deletePatientThunk(patient._id)).unwrap();
            toast.success('Patient deleted successfully');
            setConfirmation({
              isOpen: false,
              message: '',
              onConfirm: () => {},
            });
          } catch (err) {
            toast.error(`Failed to delete patient: ${err}`);
            setConfirmation({
              isOpen: false,
              message: '',
              onConfirm: () => {},
            });
          }
        },
      });
    },
    [dispatch]
  );

  const handleBlockPatient = useCallback(
    async (patient: Patient) => {
      const action = patient.isBlocked ? 'unblock' : 'block';
      setConfirmation({
        isOpen: true,
        message: `Are you sure you want to ${action} patient ${patient.name || 'Unknown'}?`,
        onConfirm: async () => {
          try {
            await dispatch(
              blockPatientThunk({
                id: patient._id,
                isBlocked: !patient.isBlocked,
              })
            ).unwrap();
            toast.success(`Patient ${action}ed successfully`);
            setConfirmation({
              isOpen: false,
              message: '',
              onConfirm: () => {},
            });
          } catch (err) {
            toast.error(`Failed to ${action} patient: ${err}`);
            setConfirmation({
              isOpen: false,
              message: '',
              onConfirm: () => {},
            });
          }
        },
      });
    },
    [dispatch]
  );

  const columns = useMemo(
    () => [
      {
        header: 'Name',
        accessor: (patient: Patient): React.ReactNode => (
          <div className="flex items-center">
            <Avatar
              name={patient.name || 'Unknown'}
              id={patient._id}
              profilePicture={patient.profilePicture ?? ''}
            />
            <span className="ml-4 text-sm font-medium text-white">
              {patient.name || 'Unknown'}
            </span>
          </div>
        ),
      },
      {
        header: 'Email',
        accessor: 'email' as keyof Patient,
      },
      {
        header: 'Phone',
        accessor: 'phone' as keyof Patient,
      },
      {
        header: 'Joined Date',
        accessor: (patient: Patient): React.ReactNode =>
          patient.createdAt ? formatDate(patient.createdAt) : 'N/A',
      },
      {
        header: 'Status',
        accessor: (patient: Patient): React.ReactNode => (
          <div className="flex flex-col space-y-1">
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${patient.isSubscribed ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}
            >
              {patient.isSubscribed ? 'Subscribed' : 'Not Subscribed'}
            </span>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${patient.isBlocked ? 'bg-red-500/20 text-red-300' : 'bg-gray-500/20 text-gray-300'}`}
            >
              {patient.isBlocked ? 'Blocked' : 'Active'}
            </span>
          </div>
        ),
      },
    ],
    []
  );

  const actions = useMemo<Action[]>(
    () => [
      {
        label: 'Edit',
        onClick: (patient: Patient) => setEditPatient(patient),
        className: 'bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg',
      },
      {
        label: 'Delete',
        onClick: handleDeletePatient,
        className: 'bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg',
      },
      {
        label: 'Block',
        onClick: handleBlockPatient,
        className: 'bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded-lg',
        condition: (patient: Patient) => patient.isBlocked === false,
      },
      {
        label: 'Unblock',
        onClick: handleBlockPatient,
        className: 'bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg',
        condition: (patient: Patient) => patient.isBlocked === true,
      },
    ],
    [handleDeletePatient, handleBlockPatient]
  );

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'All Statuses' },
      { value: 'active', label: 'Active' },
      { value: 'blocked', label: 'Blocked' },
      { value: 'subscribed', label: 'Subscribed' },
      { value: 'notSubscribed', label: 'Not Subscribed' },
    ],
    []
  );

  const sortOptions = useMemo(
    () => [
      { value: 'createdAt:desc', label: 'Newest First' },
      { value: 'createdAt:asc', label: 'Oldest First' },
      { value: 'name:asc', label: 'Name (A-Z)' },
      { value: 'name:desc', label: 'Name (Z-A)' },
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <SearchBar
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search patients..."
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            + Add Patient
          </button>
        </div>
      </div>
      <DataTable
        data={patients}
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
          };

          if (statusFilter !== 'all') {
            if (statusFilter === 'active') params.isBlocked = false;
            if (statusFilter === 'blocked') params.isBlocked = true;
            if (statusFilter === 'subscribed') params.isSubscribed = true;
            if (statusFilter === 'notSubscribed') params.isSubscribed = false;
          }

          dispatch(listPatientsThunk(params));
        }}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Patient"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePatient}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
            >
              Submit
            </button>
          </div>
        }
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Name"
          className="w-full p-3 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          value={newPatient.name}
          onChange={(e) =>
            setNewPatient({ ...newPatient, name: e.target.value })
          }
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          value={newPatient.email}
          onChange={(e) =>
            setNewPatient({ ...newPatient, email: e.target.value })
          }
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          value={newPatient.password}
          onChange={(e) =>
            setNewPatient({ ...newPatient, password: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Phone"
          className="w-full p-3 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          value={newPatient.phone}
          onChange={(e) =>
            setNewPatient({ ...newPatient, phone: e.target.value })
          }
        />
      </Modal>
      {editPatient && (
        <Modal
          isOpen={!!editPatient}
          onClose={() => setEditPatient(null)}
          title="Edit Patient"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditPatient(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePatient}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
              >
                Submit
              </button>
            </div>
          }
        >
          <input
            type="text"
            placeholder="Name"
            className="w-full p-3 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={editPatient.name}
            onChange={(e) =>
              setEditPatient({ ...editPatient, name: e.target.value })
            }
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={editPatient.email}
            onChange={(e) =>
              setEditPatient({ ...editPatient, email: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Phone"
            className="w-full p-3 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={editPatient.phone}
            onChange={(e) =>
              setEditPatient({ ...editPatient, phone: e.target.value })
            }
          />
        </Modal>
      )}
      <Modal
        isOpen={confirmation.isOpen}
        onClose={() =>
          setConfirmation({ isOpen: false, message: '', onConfirm: () => {} })
        }
        title="Confirm Action"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() =>
                setConfirmation({
                  isOpen: false,
                  message: '',
                  onConfirm: () => {},
                })
              }
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={confirmation.onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300"
            >
              Confirm
            </button>
          </div>
        }
      >
        <p className="text-gray-300">{confirmation.message}</p>
      </Modal>
    </div>
  );
};

export default AdminManagePatients;
