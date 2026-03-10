import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  listDoctorsThunk,
  createDoctorThunk,
  updateDoctorThunk,
  deleteDoctorThunk,
  blockDoctorThunk,
  verifyDoctorThunk,
  getAllSpecialitiesThunk,
} from '../../redux/thunks/adminThunk';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import FilterSelect from '../../components/common/FilterSelect';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Avatar from '../../components/common/Avatar';
import { Doctor, QueryParams } from '../../types/authTypes';
import {
  validateName,
  validateEmail,
  validatePassword,
  validatePhone,
  validateLicenseNumber,
} from '../../utils/validation';
import { ITEMS_PER_PAGE } from '../../utils/constants';
import { showError, showSuccess } from '../../utils/toastConfig';
import {
  Stethoscope,
  Plus,
  AlertTriangle,
  ShieldCheck,
  ShieldOff,
  ExternalLink,
} from 'lucide-react';

const AdminManageDoctors: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    doctors,
    specialities,
    loading,
    error,
    totalPages: totalPagesFromState,
  } = useAppSelector((state) => state.admin);
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('createdAt:desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);
  const [newDoctor, setNewDoctor] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    licenseNumber: '',
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    licenseNumber: '',
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    dispatch(getAllSpecialitiesThunk({ page: 1, limit: 10 }));
  }, [dispatch]);

  useEffect(() => {
    if (user?.role === 'admin') {
      const [sortBy, sortOrder] = sortFilter.split(':') as [
        string,
        'asc' | 'desc',
      ];
      const params: QueryParams = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchTerm.trim() || undefined,
        sortBy,
        sortOrder,
        speciality: specialtyFilter !== 'all' ? specialtyFilter : undefined,
      };
      if (statusFilter !== 'all') {
        if (statusFilter === 'verified') params.isVerified = true;
        if (statusFilter === 'unverified') params.isVerified = false;
        if (statusFilter === 'blocked') params.isBlocked = true;
        if (statusFilter === 'active') params.isBlocked = false;
      }
      dispatch(listDoctorsThunk(params));
    }
  }, [
    dispatch,
    user?.role,
    currentPage,
    searchTerm,
    statusFilter,
    specialtyFilter,
    sortFilter,
  ]);

  useEffect(() => {
    setTotalPages(totalPagesFromState.doctors);
  }, [totalPagesFromState.doctors]);

  const resetFormErrors = () =>
    setFormErrors({
      name: '',
      email: '',
      password: '',
      phone: '',
      licenseNumber: '',
    });

  const validateForm = useCallback((doctor: typeof newDoctor | Doctor) => {
    const errors = {
      name: validateName(doctor.name) || '',
      email: validateEmail(doctor.email) || '',
      password:
        'password' in doctor ? validatePassword(doctor.password) || '' : '',
      phone: validatePhone(doctor.phone) || '',
      licenseNumber: validateLicenseNumber(doctor.licenseNumber) || '',
    };
    setFormErrors(errors);
    return Object.values(errors).every((e) => !e);
  }, []);

  const handleCreateDoctor = useCallback(async () => {
    if (!validateForm(newDoctor)) {
      showError('Please fix the form errors');
      return;
    }
    try {
      await dispatch(createDoctorThunk(newDoctor)).unwrap();
      showSuccess('Doctor created successfully');
      setIsModalOpen(false);
      setNewDoctor({
        email: '',
        password: '',
        name: '',
        phone: '',
        licenseNumber: '',
      });
      resetFormErrors();
    } catch (err) {
      showError(`Failed to create doctor: ${err}`);
    }
  }, [dispatch, newDoctor, validateForm]);

  const handleUpdateDoctor = useCallback(async () => {
    if (!editDoctor || !validateForm(editDoctor)) {
      showError('Please fix the form errors');
      return;
    }
    try {
      await dispatch(
        updateDoctorThunk({ id: editDoctor._id, updates: editDoctor })
      ).unwrap();
      showSuccess('Doctor updated successfully');
      setEditDoctor(null);
      resetFormErrors();
    } catch (err) {
      showError(`Failed to update doctor: ${err}`);
    }
  }, [dispatch, editDoctor, validateForm]);

  const handleDeleteDoctor = useCallback(async () => {
    if (!selectedDoctor) return;
    try {
      await dispatch(deleteDoctorThunk(selectedDoctor._id)).unwrap();
      showSuccess('Doctor deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedDoctor(null);
    } catch (err) {
      showError(`Failed to delete doctor: ${err}`);
    }
  }, [dispatch, selectedDoctor]);

  const handleBlockDoctor = useCallback(async () => {
    if (!selectedDoctor) return;
    const action = selectedDoctor.isBlocked ? 'unblock' : 'block';
    try {
      await dispatch(
        blockDoctorThunk({
          id: selectedDoctor._id,
          isBlocked: !selectedDoctor.isBlocked,
        })
      ).unwrap();
      showSuccess(`Doctor ${action}ed successfully`);
      setIsBlockModalOpen(false);
      setSelectedDoctor(null);
    } catch (err) {
      showError(`Failed to ${action} doctor: ${err}`);
    }
  }, [dispatch, selectedDoctor]);

  const handleVerifyDoctor = useCallback(async () => {
    if (!selectedDoctor) return;
    try {
      await dispatch(verifyDoctorThunk(selectedDoctor._id)).unwrap();
      showSuccess('Doctor verified successfully');
      setIsVerifyModalOpen(false);
      setSelectedDoctor(null);
    } catch (err) {
      showError(`Failed to verify doctor: ${err}`);
    }
  }, [dispatch, selectedDoctor]);

  const columns = useMemo(
    () => [
      {
        header: 'Name',
        accessor: (doctor: Doctor): React.ReactNode => {
          const maxLength = 20;
          const displayName =
            doctor.name && doctor.name.length > maxLength
              ? `${doctor.name.substring(0, maxLength)}...`
              : doctor.name || 'Unknown';
          return (
            <div className="flex items-center gap-3">
              <Avatar
                name={doctor.name || 'Unknown'}
                id={doctor._id}
                profilePicture={doctor.profilePicture}
              />
              <span
                className="text-sm font-medium text-text-primary truncate max-w-[150px]"
                title={doctor.name || 'Unknown'}
              >
                {displayName}
              </span>
            </div>
          );
        },
        className: 'align-middle',
        minWidth: '200px',
      },
      { header: 'Email', accessor: 'email' as keyof Doctor, minWidth: '200px' },
      { header: 'Phone', accessor: 'phone' as keyof Doctor, minWidth: '120px' },
      {
        header: 'License',
        accessor: 'licenseNumber' as keyof Doctor,
        minWidth: '120px',
      },
      {
        header: 'License Proof',
        accessor: (doctor: Doctor): React.ReactNode =>
          doctor.licenseProof ? (
            <a
              href={doctor.licenseProof}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-medium"
            >
              <ExternalLink size={12} /> View
            </a>
          ) : (
            <span className="text-text-muted text-xs">No License</span>
          ),
        minWidth: '120px',
      },
      {
        header: 'Status',
        accessor: (doctor: Doctor): React.ReactNode => (
          <div className="flex flex-wrap gap-1.5">
            <span
              className={`badge ${doctor.isVerified ? 'badge-success' : 'badge-neutral'}`}
            >
              {doctor.isVerified ? 'Verified' : 'Unverified'}
            </span>
            <span
              className={`badge ${doctor.isBlocked ? 'badge-error' : 'badge-neutral'}`}
            >
              {doctor.isBlocked ? 'Blocked' : 'Active'}
            </span>
          </div>
        ),
        minWidth: '180px',
      },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        label: 'Edit',
        onClick: (doctor: Doctor) => setEditDoctor(doctor),
        className: 'btn-secondary text-xs px-3 py-1.5',
      },
      {
        label: 'Delete',
        onClick: (doctor: Doctor) => {
          setSelectedDoctor(doctor);
          setIsDeleteModalOpen(true);
        },
        className: 'btn-danger text-xs px-3 py-1.5',
      },
      {
        label: 'Block',
        onClick: (doctor: Doctor) => {
          setSelectedDoctor(doctor);
          setIsBlockModalOpen(true);
        },
        className:
          'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
        condition: (doctor: Doctor) => !doctor.isBlocked,
      },
      {
        label: 'Unblock',
        onClick: (doctor: Doctor) => {
          setSelectedDoctor(doctor);
          setIsBlockModalOpen(true);
        },
        className:
          'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
        condition: (doctor: Doctor) => doctor.isBlocked,
      },
      {
        label: 'Verify',
        onClick: (doctor: Doctor) => {
          setSelectedDoctor(doctor);
          setIsVerifyModalOpen(true);
        },
        className:
          'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
        condition: (doctor: Doctor) => !doctor.isVerified,
      },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'All Statuses' },
      { value: 'verified', label: 'Verified' },
      { value: 'unverified', label: 'Unverified' },
      { value: 'blocked', label: 'Blocked' },
      { value: 'active', label: 'Active' },
    ],
    []
  );

  const specialtyOptions = useMemo(
    () => [
      { value: 'all', label: 'All Specialties' },
      ...specialities.map((s) => ({ value: s.name, label: s.name })),
    ],
    [specialities]
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

  // Shared form field renderer
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

  const ConfirmModal = ({
    isOpen,
    onClose,
    title,
    message,
    onConfirm,
    confirmLabel,
    confirmClass,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
    confirmLabel: string;
    confirmClass: string;
  }) => (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className={confirmClass}>
            {confirmLabel}
          </button>
        </div>
      }
    >
      <div className="flex gap-3 items-start">
        <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={16} className="text-red-500" />
        </div>
        <div className="pt-1 text-sm text-text-secondary">{message}</div>
      </div>
    </Modal>
  );

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
            <Stethoscope size={18} className="text-primary-600" />
          </div>
          <div>
            <h1 className="page-title">Manage Doctors</h1>
            <p className="page-subtitle">
              View, verify, and manage all registered doctors
            </p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={16} />
          Add Doctor
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
          <SearchBar
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search doctors..."
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
              value={specialtyFilter}
              options={specialtyOptions}
              onChange={setSpecialtyFilter}
              label="Specialty"
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
          data={doctors}
          columns={columns}
          actions={actions}
          isLoading={loading}
          error={error}
          onRetry={() => {
            const [sortBy, sortOrder] = sortFilter.split(':') as [
              string,
              'asc' | 'desc',
            ];
            const params: QueryParams = {
              page: currentPage,
              limit: ITEMS_PER_PAGE,
              search: searchTerm.trim(),
              sortBy,
              sortOrder,
              speciality:
                specialtyFilter !== 'all' ? specialtyFilter : undefined,
            };
            if (statusFilter !== 'all') {
              if (statusFilter === 'verified') params.isVerified = true;
              if (statusFilter === 'unverified') params.isVerified = false;
              if (statusFilter === 'blocked') params.isBlocked = true;
              if (statusFilter === 'active') params.isBlocked = false;
            }
            dispatch(listDoctorsThunk(params));
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

      {/* Add Doctor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetFormErrors();
        }}
        title="Add Doctor"
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
            <button onClick={handleCreateDoctor} className="btn-primary">
              Create Doctor
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField
            label="Full Name"
            placeholder="Dr. John Smith"
            value={newDoctor.name}
            error={formErrors.name}
            onChange={(v) => {
              setNewDoctor({ ...newDoctor, name: v });
              setFormErrors({ ...formErrors, name: validateName(v) || '' });
            }}
          />
          <FormField
            label="Email"
            type="email"
            placeholder="doctor@example.com"
            value={newDoctor.email}
            error={formErrors.email}
            onChange={(v) => {
              setNewDoctor({ ...newDoctor, email: v });
              setFormErrors({ ...formErrors, email: validateEmail(v) || '' });
            }}
          />
          <FormField
            label="Password"
            type="password"
            placeholder="••••••••"
            value={newDoctor.password}
            error={formErrors.password}
            onChange={(v) => {
              setNewDoctor({ ...newDoctor, password: v });
              setFormErrors({
                ...formErrors,
                password: validatePassword(v) || '',
              });
            }}
          />
          <FormField
            label="Phone"
            placeholder="+91 98765 43210"
            value={newDoctor.phone}
            error={formErrors.phone}
            onChange={(v) => {
              setNewDoctor({ ...newDoctor, phone: v });
              setFormErrors({ ...formErrors, phone: validatePhone(v) || '' });
            }}
          />
          <FormField
            label="License Number"
            placeholder="MED-XXXX-XXXX"
            value={newDoctor.licenseNumber}
            error={formErrors.licenseNumber}
            onChange={(v) => {
              setNewDoctor({ ...newDoctor, licenseNumber: v });
              setFormErrors({
                ...formErrors,
                licenseNumber: validateLicenseNumber(v) || '',
              });
            }}
          />
        </div>
      </Modal>

      {/* Edit Doctor Modal */}
      {editDoctor && (
        <Modal
          isOpen={!!editDoctor}
          onClose={() => {
            setEditDoctor(null);
            resetFormErrors();
          }}
          title="Edit Doctor"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditDoctor(null);
                  resetFormErrors();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleUpdateDoctor} className="btn-primary">
                Save Changes
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <FormField
              label="Full Name"
              placeholder="Dr. John Smith"
              value={editDoctor.name}
              error={formErrors.name}
              onChange={(v) => {
                setEditDoctor({ ...editDoctor, name: v });
                setFormErrors({ ...formErrors, name: validateName(v) || '' });
              }}
            />
            <FormField
              label="Email"
              type="email"
              placeholder="doctor@example.com"
              value={editDoctor.email}
              error={formErrors.email}
              onChange={(v) => {
                setEditDoctor({ ...editDoctor, email: v });
                setFormErrors({ ...formErrors, email: validateEmail(v) || '' });
              }}
            />
            <FormField
              label="Phone"
              placeholder="+91 98765 43210"
              value={editDoctor.phone}
              error={formErrors.phone}
              onChange={(v) => {
                setEditDoctor({ ...editDoctor, phone: v });
                setFormErrors({ ...formErrors, phone: validatePhone(v) || '' });
              }}
            />
            <FormField
              label="License Number"
              placeholder="MED-XXXX-XXXX"
              value={editDoctor.licenseNumber}
              error={formErrors.licenseNumber}
              onChange={(v) => {
                setEditDoctor({ ...editDoctor, licenseNumber: v });
                setFormErrors({
                  ...formErrors,
                  licenseNumber: validateLicenseNumber(v) || '',
                });
              }}
            />
            <div>
              <label className="label">License Proof</label>
              {editDoctor.licenseProof ? (
                <a
                  href={editDoctor.licenseProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  <ExternalLink size={14} /> View License Proof
                </a>
              ) : (
                <span className="text-sm text-text-muted">
                  No License Proof uploaded
                </span>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedDoctor && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedDoctor(null);
          }}
          title="Delete Doctor"
          message={
            <>
              Permanently delete{' '}
              <span className="font-semibold text-text-primary">
                {selectedDoctor.name}
              </span>
              ? This action cannot be undone.
            </>
          }
          onConfirm={handleDeleteDoctor}
          confirmLabel="Delete"
          confirmClass="btn-danger"
        />
      )}

      {/* Block/Unblock Modal */}
      {isBlockModalOpen && selectedDoctor && (
        <Modal
          isOpen={isBlockModalOpen}
          onClose={() => {
            setIsBlockModalOpen(false);
            setSelectedDoctor(null);
          }}
          title={selectedDoctor.isBlocked ? 'Unblock Doctor' : 'Block Doctor'}
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsBlockModalOpen(false);
                  setSelectedDoctor(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockDoctor}
                className={
                  selectedDoctor.isBlocked
                    ? 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                    : 'bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                }
              >
                {selectedDoctor.isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          }
        >
          <div className="flex gap-3 items-start">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${selectedDoctor.isBlocked ? 'bg-green-50' : 'bg-amber-50'}`}
            >
              {selectedDoctor.isBlocked ? (
                <ShieldCheck size={16} className="text-green-600" />
              ) : (
                <ShieldOff size={16} className="text-amber-600" />
              )}
            </div>
            <p className="pt-1 text-sm text-text-secondary">
              Are you sure you want to{' '}
              {selectedDoctor.isBlocked ? 'unblock' : 'block'}{' '}
              <span className="font-semibold text-text-primary">
                {selectedDoctor.name}
              </span>
              ?
              {!selectedDoctor.isBlocked &&
                ' They will no longer be able to access the platform.'}
            </p>
          </div>
        </Modal>
      )}

      {/* Verify Modal */}
      {isVerifyModalOpen && selectedDoctor && (
        <Modal
          isOpen={isVerifyModalOpen}
          onClose={() => {
            setIsVerifyModalOpen(false);
            setSelectedDoctor(null);
          }}
          title="Verify Doctor"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsVerifyModalOpen(false);
                  setSelectedDoctor(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleVerifyDoctor} className="btn-primary">
                <ShieldCheck size={15} /> Verify
              </button>
            </div>
          }
        >
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={16} className="text-primary-600" />
            </div>
            <p className="pt-1 text-sm text-text-secondary">
              Verify{' '}
              <span className="font-semibold text-text-primary">
                {selectedDoctor.name}
              </span>
              ? This will grant them full access to the platform as a licensed
              physician.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminManageDoctors;
