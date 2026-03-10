import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import { formatDate } from '../../utils/helpers';
import {
  validateName,
  validateEmail,
  validatePassword,
  validatePhone,
} from '../../utils/validation';
import { ITEMS_PER_PAGE } from '../../utils/constants';
import { showSuccess, showError } from '../../utils/toastConfig';
import {
  Users,
  Plus,
  AlertTriangle,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';

interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isBlocked?: boolean;
  isSubscribed?: boolean;
}

interface Action {
  label: string;
  onClick: (item: Patient) => void | Promise<void>;
  className?: string;
  condition?: (item: Patient) => boolean;
}

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
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      const [sortBy, sortOrder] = sortFilter.split(':') as [
        string,
        'asc' | 'desc',
      ];
      const params: PaginationParams = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchTerm.trim() || undefined,
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

  const resetFormErrors = () =>
    setFormErrors({ name: '', email: '', password: '', phone: '' });

  const validateForm = useCallback((patient: typeof newPatient | Patient) => {
    const errors = {
      name: validateName(patient.name ?? '') || '',
      email: validateEmail(patient.email ?? '') || '',
      password:
        'password' in patient
          ? validatePassword(patient.password ?? '') || ''
          : '',
      phone: validatePhone(patient.phone ?? '') || '',
    };
    setFormErrors(errors);
    return Object.values(errors).every((e) => !e);
  }, []);

  const handleCreatePatient = useCallback(async () => {
    if (!validateForm(newPatient)) {
      showError('Please fix the form errors');
      return;
    }
    try {
      await dispatch(createPatientThunk(newPatient)).unwrap();
      showSuccess('Patient created successfully');
      setIsModalOpen(false);
      setNewPatient({ email: '', password: '', name: '', phone: '' });
      resetFormErrors();
    } catch (err) {
      showError(`Failed to create patient: ${err}`);
    }
  }, [dispatch, newPatient, validateForm]);

  const handleUpdatePatient = useCallback(async () => {
    if (!editPatient || !validateForm(editPatient)) {
      showError('Please fix the form errors');
      return;
    }
    try {
      await dispatch(
        updatePatientThunk({ id: editPatient._id, updates: editPatient })
      ).unwrap();
      showSuccess('Patient updated successfully');
      setEditPatient(null);
      resetFormErrors();
    } catch (err) {
      showError(`Failed to update patient: ${err}`);
    }
  }, [dispatch, editPatient, validateForm]);

  const handleDeletePatient = useCallback(async () => {
    if (!selectedPatient) return;
    try {
      await dispatch(deletePatientThunk(selectedPatient._id)).unwrap();
      showSuccess('Patient deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedPatient(null);
    } catch (err) {
      showError(`Failed to delete patient: ${err}`);
      setIsDeleteModalOpen(false);
      setSelectedPatient(null);
    }
  }, [dispatch, selectedPatient]);

  const handleBlockPatient = useCallback(async () => {
    if (!selectedPatient) return;
    const action = selectedPatient.isBlocked ? 'unblock' : 'block';
    try {
      await dispatch(
        blockPatientThunk({
          id: selectedPatient._id,
          isBlocked: !selectedPatient.isBlocked,
        })
      ).unwrap();
      showSuccess(`Patient ${action}ed successfully`);
      setIsBlockModalOpen(false);
      setSelectedPatient(null);
    } catch (err) {
      showError(`Failed to ${action} patient: ${err}`);
      setIsBlockModalOpen(false);
      setSelectedPatient(null);
    }
  }, [dispatch, selectedPatient]);

  const columns = useMemo(
    () => [
      {
        header: 'Name',
        accessor: (patient: Patient): React.ReactNode => {
          const maxLength = 20;
          const displayName =
            patient.name && patient.name.length > maxLength
              ? `${patient.name.substring(0, maxLength)}...`
              : patient.name || 'Unknown';
          return (
            <div className="flex items-center gap-3">
              <Avatar
                name={patient.name || 'Unknown'}
                id={patient._id}
                profilePicture={patient.profilePicture ?? ''}
              />
              <span className="text-sm font-medium text-text-primary truncate max-w-[150px]">
                {displayName}
              </span>
            </div>
          );
        },
        className: 'align-middle',
      },
      { header: 'Email', accessor: 'email' as keyof Patient },
      { header: 'Phone', accessor: 'phone' as keyof Patient },
      {
        header: 'Joined',
        accessor: (patient: Patient): React.ReactNode =>
          patient.createdAt ? formatDate(patient.createdAt) : 'N/A',
      },
      {
        header: 'Status',
        accessor: (patient: Patient): React.ReactNode => (
          <div className="flex flex-col gap-1">
            <span
              className={`badge ${patient.isSubscribed ? 'badge-success' : 'badge-neutral'}`}
            >
              {patient.isSubscribed ? 'Subscribed' : 'Not Subscribed'}
            </span>
            <span
              className={`badge ${patient.isBlocked ? 'badge-error' : 'badge-neutral'}`}
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
        className: 'btn-secondary text-xs px-3 py-1.5',
      },
      {
        label: 'Delete',
        onClick: (patient: Patient) => {
          setSelectedPatient(patient);
          setIsDeleteModalOpen(true);
        },
        className: 'btn-danger text-xs px-3 py-1.5',
      },
      {
        label: 'Block',
        onClick: (patient: Patient) => {
          setSelectedPatient(patient);
          setIsBlockModalOpen(true);
        },
        className:
          'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
        condition: (patient: Patient) => patient.isBlocked === false,
      },
      {
        label: 'Unblock',
        onClick: (patient: Patient) => {
          setSelectedPatient(patient);
          setIsBlockModalOpen(true);
        },
        className:
          'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
        condition: (patient: Patient) => patient.isBlocked === true,
      },
    ],
    []
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

  const handlePageChange = useCallback(
    (page: number) => setCurrentPage(page),
    []
  );
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term.trim());
    setCurrentPage(1);
  }, []);

  const FormField = ({
    label,
    type = 'text',
    placeholder,
    value,
    error,
    onChange,
  }: {
    label: string;
    type?: string;
    placeholder: string;
    value: string;
    error: string;
    onChange: (v: string) => void;
  }) => (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className={`input ${error ? 'input-error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="error-text">{error}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
            <Users size={18} className="text-teal-600" />
          </div>
          <div>
            <h1 className="page-title">Manage Patients</h1>
            <p className="page-subtitle">
              View and manage all registered patients
            </p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={16} />
          Add Patient
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
          <SearchBar
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search patients..."
          />
          <div className="flex flex-wrap gap-3">
            <FilterSelect
              value={statusFilter}
              options={statusOptions}
              onChange={setStatusFilter}
              label="Status"
              className="w-44"
            />
            <FilterSelect
              value={sortFilter}
              options={sortOptions}
              onChange={setSortFilter}
              label="Sort By"
              className="w-44"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
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
              search: searchTerm.trim() || undefined,
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
        <div className="border-t border-surface-border px-4 py-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Add Patient Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetFormErrors();
        }}
        title="Add Patient"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetFormErrors();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handleCreatePatient} className="btn-primary">
              Create Patient
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField
            label="Full Name"
            placeholder="Jane Doe"
            value={newPatient.name}
            error={formErrors.name}
            onChange={(v) => {
              setNewPatient({ ...newPatient, name: v });
              setFormErrors({ ...formErrors, name: validateName(v) || '' });
            }}
          />
          <FormField
            label="Email"
            type="email"
            placeholder="patient@example.com"
            value={newPatient.email}
            error={formErrors.email}
            onChange={(v) => {
              setNewPatient({ ...newPatient, email: v });
              setFormErrors({ ...formErrors, email: validateEmail(v) || '' });
            }}
          />
          <FormField
            label="Password"
            type="password"
            placeholder="••••••••"
            value={newPatient.password}
            error={formErrors.password}
            onChange={(v) => {
              setNewPatient({ ...newPatient, password: v });
              setFormErrors({
                ...formErrors,
                password: validatePassword(v) || '',
              });
            }}
          />
          <FormField
            label="Phone"
            placeholder="+91 98765 43210"
            value={newPatient.phone}
            error={formErrors.phone}
            onChange={(v) => {
              setNewPatient({ ...newPatient, phone: v });
              setFormErrors({ ...formErrors, phone: validatePhone(v) || '' });
            }}
          />
        </div>
      </Modal>

      {/* Edit Patient Modal */}
      {editPatient && (
        <Modal
          isOpen={!!editPatient}
          onClose={() => {
            setEditPatient(null);
            resetFormErrors();
          }}
          title="Edit Patient"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditPatient(null);
                  resetFormErrors();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleUpdatePatient} className="btn-primary">
                Save Changes
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <FormField
              label="Full Name"
              placeholder="Jane Doe"
              value={editPatient.name ?? ''}
              error={formErrors.name}
              onChange={(v) => {
                setEditPatient({ ...editPatient, name: v });
                setFormErrors({ ...formErrors, name: validateName(v) || '' });
              }}
            />
            <FormField
              label="Email"
              type="email"
              placeholder="patient@example.com"
              value={editPatient.email ?? ''}
              error={formErrors.email}
              onChange={(v) => {
                setEditPatient({ ...editPatient, email: v });
                setFormErrors({ ...formErrors, email: validateEmail(v) || '' });
              }}
            />
            <FormField
              label="Phone"
              placeholder="+91 98765 43210"
              value={editPatient.phone ?? ''}
              error={formErrors.phone}
              onChange={(v) => {
                setEditPatient({ ...editPatient, phone: v });
                setFormErrors({ ...formErrors, phone: validatePhone(v) || '' });
              }}
            />
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedPatient && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedPatient(null);
          }}
          title="Delete Patient"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedPatient(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleDeletePatient} className="btn-danger">
                Delete
              </button>
            </div>
          }
        >
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <p className="pt-1 text-sm text-text-secondary">
              Permanently delete{' '}
              <span className="font-semibold text-text-primary">
                {selectedPatient.name || 'Unknown'}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
        </Modal>
      )}

      {/* Block/Unblock Modal */}
      {isBlockModalOpen && selectedPatient && (
        <Modal
          isOpen={isBlockModalOpen}
          onClose={() => {
            setIsBlockModalOpen(false);
            setSelectedPatient(null);
          }}
          title={
            selectedPatient.isBlocked ? 'Unblock Patient' : 'Block Patient'
          }
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsBlockModalOpen(false);
                  setSelectedPatient(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockPatient}
                className={
                  selectedPatient.isBlocked
                    ? 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                    : 'bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                }
              >
                {selectedPatient.isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          }
        >
          <div className="flex gap-3 items-start">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${selectedPatient.isBlocked ? 'bg-green-50' : 'bg-amber-50'}`}
            >
              {selectedPatient.isBlocked ? (
                <ShieldCheck size={16} className="text-green-600" />
              ) : (
                <ShieldOff size={16} className="text-amber-600" />
              )}
            </div>
            <p className="pt-1 text-sm text-text-secondary">
              Are you sure you want to{' '}
              {selectedPatient.isBlocked ? 'unblock' : 'block'}{' '}
              <span className="font-semibold text-text-primary">
                {selectedPatient.name || 'Unknown'}
              </span>
              ?
              {!selectedPatient.isBlocked &&
                ' They will no longer be able to access the platform.'}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminManagePatients;
