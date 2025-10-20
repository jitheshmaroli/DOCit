import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);

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
    return Object.values(errors).every((error) => !error);
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
      setFormErrors({
        name: '',
        email: '',
        password: '',
        phone: '',
        licenseNumber: '',
      });
    } catch (err) {
      console.error(`Failed to create doctor: ${err}`);
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
      setFormErrors({
        name: '',
        email: '',
        password: '',
        phone: '',
        licenseNumber: '',
      });
    } catch (err) {
      console.error(`Failed to update doctor: ${err}`);
      showError(`Failed to update doctor: ${err}`);
    }
  }, [dispatch, editDoctor, validateForm]);

  const handleDeleteDoctor = useCallback(
    async () => {
      if (!selectedDoctor) return;
      try {
        await dispatch(deleteDoctorThunk(selectedDoctor._id)).unwrap();
        showSuccess('Doctor deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedDoctor(null);
      } catch (err) {
        console.error(`Failed to delete doctor: ${err}`);
        showError(`Failed to delete doctor: ${err}`);
      }
    },
    [dispatch, selectedDoctor]
  );

  const handleBlockDoctor = useCallback(
    async () => {
      if (!selectedDoctor) return;
      const action = selectedDoctor.isBlocked ? 'unblock' : 'block';
      try {
        await dispatch(
          blockDoctorThunk({ id: selectedDoctor._id, isBlocked: !selectedDoctor.isBlocked })
        ).unwrap();
        showSuccess(`Doctor ${action}ed successfully`);
        setIsBlockModalOpen(false);
        setSelectedDoctor(null);
      } catch (err) {
        console.error(`Failed to ${action} doctor: ${err}`);
        showError(`Failed to ${action} doctor: ${err}`);
      }
    },
    [dispatch, selectedDoctor]
  );

  const handleVerifyDoctor = useCallback(
    async () => {
      if (!selectedDoctor) return;
      try {
        await dispatch(verifyDoctorThunk(selectedDoctor._id)).unwrap();
        showSuccess('Doctor verified successfully');
        setIsVerifyModalOpen(false);
        setSelectedDoctor(null);
      } catch (err) {
        console.error(`Failed to verify doctor: ${err}`);
        showError(`Failed to verify doctor: ${err}`);
      }
    },
    [dispatch, selectedDoctor]
  );

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
            <div className="flex items-center">
              <Avatar
                name={doctor.name || 'Unknown'}
                id={doctor._id}
                profilePicture={doctor.profilePicture}
              />
              <span
                className="ml-4 text-sm font-medium text-white truncate"
                style={{ maxWidth: '150px' }}
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
      {
        header: 'Email',
        accessor: 'email' as keyof Doctor,
        minWidth: '200px',
      },
      {
        header: 'Phone',
        accessor: 'phone' as keyof Doctor,
        minWidth: '120px',
      },
      {
        header: 'License',
        accessor: 'licenseNumber' as keyof Doctor,
        minWidth: '120px',
      },
      {
        header: 'License Proof',
        accessor: (doctor: Doctor): React.ReactNode => (
          <div>
            {doctor.licenseProof ? (
              <a
                href={doctor.licenseProof}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-500 underline"
              >
                View License
              </a>
            ) : (
              <span className="text-gray-400">No License</span>
            )}
          </div>
        ),
        minWidth: '120px',
      },
      {
        header: 'Status',
        accessor: (doctor: Doctor): React.ReactNode => (
          <div className="flex flex-nowrap gap-2">
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${doctor.isVerified ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}
            >
              {doctor.isVerified ? 'Verified' : 'Unverified'}
            </span>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${doctor.isBlocked ? 'bg-red-500/20 text-red-300' : 'bg-gray-500/20 text-gray-300'}`}
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
        className: 'bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg',
      },
      {
        label: 'Delete',
        onClick: (doctor: Doctor) => {
          setSelectedDoctor(doctor);
          setIsDeleteModalOpen(true);
        },
        className: 'bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg',
      },
      {
        label: 'Block',
        onClick: (doctor: Doctor) => {
          setSelectedDoctor(doctor);
          setIsBlockModalOpen(true);
        },
        className: 'bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded-lg',
        condition: (doctor: Doctor) => !doctor.isBlocked,
      },
      {
        label: 'Unblock',
        onClick: (doctor: Doctor) => {
          setSelectedDoctor(doctor);
          setIsBlockModalOpen(true);
        },
        className: 'bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg',
        condition: (doctor: Doctor) => doctor.isBlocked,
      },
      {
        label: 'Verify',
        onClick: (doctor: Doctor) => {
          setSelectedDoctor(doctor);
          setIsVerifyModalOpen(true);
        },
        className: 'bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg',
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
      ...specialities.map((specialty) => ({
        value: specialty.name,
        label: specialty.name,
      })),
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

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term.trim());
    setCurrentPage(1);
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-lg p-4 sm:p-6 lg:p-8 rounded-2xl border border-white/20 shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <SearchBar
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search doctors..."
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
            value={specialtyFilter}
            options={specialtyOptions}
            onChange={setSpecialtyFilter}
            label="Specialty"
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
            + Add Doctor
          </button>
        </div>
      </div>
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
            speciality: specialtyFilter !== 'all' ? specialtyFilter : undefined,
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormErrors({
            name: '',
            email: '',
            password: '',
            phone: '',
            licenseNumber: '',
          });
        }}
        title="Add Doctor"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setFormErrors({
                  name: '',
                  email: '',
                  password: '',
                  phone: '',
                  licenseNumber: '',
                });
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateDoctor}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
            >
              Submit
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Name"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={newDoctor.name}
              onChange={(e) => {
                setNewDoctor({ ...newDoctor, name: e.target.value });
                setFormErrors({
                  ...formErrors,
                  name: validateName(e.target.value) || '',
                });
              }}
            />
            {formErrors.name && (
              <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>
            )}
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={newDoctor.email}
              onChange={(e) => {
                setNewDoctor({ ...newDoctor, email: e.target.value });
                setFormErrors({
                  ...formErrors,
                  email: validateEmail(e.target.value) || '',
                });
              }}
            />
            {formErrors.email && (
              <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>
            )}
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={newDoctor.password}
              onChange={(e) => {
                setNewDoctor({ ...newDoctor, password: e.target.value });
                setFormErrors({
                  ...formErrors,
                  password: validatePassword(e.target.value) || '',
                });
              }}
            />
            {formErrors.password && (
              <p className="text-red-400 text-xs mt-1">{formErrors.password}</p>
            )}
          </div>
          <div>
            <input
              type="text"
              placeholder="Phone"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={newDoctor.phone}
              onChange={(e) => {
                setNewDoctor({ ...newDoctor, phone: e.target.value });
                setFormErrors({
                  ...formErrors,
                  phone: validatePhone(e.target.value) || '',
                });
              }}
            />
            {formErrors.phone && (
              <p className="text-red-400 text-xs mt-1">{formErrors.phone}</p>
            )}
          </div>
          <div>
            <input
              type="text"
              placeholder="License Number"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={newDoctor.licenseNumber}
              onChange={(e) => {
                setNewDoctor({ ...newDoctor, licenseNumber: e.target.value });
                setFormErrors({
                  ...formErrors,
                  licenseNumber: validateLicenseNumber(e.target.value) || '',
                });
              }}
            />
            {formErrors.licenseNumber && (
              <p className="text-red-400 text-xs mt-1">
                {formErrors.licenseNumber}
              </p>
            )}
          </div>
        </div>
      </Modal>
      {editDoctor && (
        <Modal
          isOpen={!!editDoctor}
          onClose={() => {
            setEditDoctor(null);
            setFormErrors({
              name: '',
              email: '',
              password: '',
              phone: '',
              licenseNumber: '',
            });
          }}
          title="Edit Doctor"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditDoctor(null);
                  setFormErrors({
                    name: '',
                    email: '',
                    password: '',
                    phone: '',
                    licenseNumber: '',
                  });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateDoctor}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
              >
                Submit
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Name"
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={editDoctor.name}
                onChange={(e) => {
                  setEditDoctor({ ...editDoctor, name: e.target.value });
                  setFormErrors({
                    ...formErrors,
                    name: validateName(e.target.value) || '',
                  });
                }}
              />
              {formErrors.name && (
                <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={editDoctor.email}
                onChange={(e) => {
                  setEditDoctor({ ...editDoctor, email: e.target.value });
                  setFormErrors({
                    ...formErrors,
                    email: validateEmail(e.target.value) || '',
                  });
                }}
              />
              {formErrors.email && (
                <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>
            <div>
              <input
                type="text"
                placeholder="Phone"
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={editDoctor.phone}
                onChange={(e) => {
                  setEditDoctor({ ...editDoctor, phone: e.target.value });
                  setFormErrors({
                    ...formErrors,
                    phone: validatePhone(e.target.value) || '',
                  });
                }}
              />
              {formErrors.phone && (
                <p className="text-red-400 text-xs mt-1">{formErrors.phone}</p>
              )}
            </div>
            <div>
              <input
                type="text"
                placeholder="License Number"
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={editDoctor.licenseNumber}
                onChange={(e) => {
                  setEditDoctor({
                    ...editDoctor,
                    licenseNumber: e.target.value,
                  });
                  setFormErrors({
                    ...formErrors,
                    licenseNumber: validateLicenseNumber(e.target.value) || '',
                  });
                }}
              />
              {formErrors.licenseNumber && (
                <p className="text-red-400 text-xs mt-1">
                  {formErrors.licenseNumber}
                </p>
              )}
            </div>
            <div className="w-full p-3">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                License Proof
              </label>
              {editDoctor.licenseProof ? (
                <a
                  href={editDoctor.licenseProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-500 underline"
                >
                  View License Proof
                </a>
              ) : (
                <span className="text-gray-400">No License Proof</span>
              )}
            </div>
          </div>
        </Modal>
      )}
      {isDeleteModalOpen && selectedDoctor && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedDoctor(null);
          }}
          title="Confirm Delete"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedDoctor(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDoctor}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300"
              >
                Delete
              </button>
            </div>
          }
        >
          <p className="text-white">
            Are you sure you want to delete {selectedDoctor.name}?
          </p>
        </Modal>
      )}
      {isBlockModalOpen && selectedDoctor && (
        <Modal
          isOpen={isBlockModalOpen}
          onClose={() => {
            setIsBlockModalOpen(false);
            setSelectedDoctor(null);
          }}
          title={selectedDoctor.isBlocked ? "Confirm Unblock" : "Confirm Block"}
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsBlockModalOpen(false);
                  setSelectedDoctor(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockDoctor}
                className={`px-4 py-2 text-white rounded-lg transition-all duration-300 ${
                  selectedDoctor.isBlocked
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {selectedDoctor.isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          }
        >
          <p className="text-white">
            Are you sure you want to {selectedDoctor.isBlocked ? 'unblock' : 'block'} {selectedDoctor.name}?
          </p>
        </Modal>
      )}
      {isVerifyModalOpen && selectedDoctor && (
        <Modal
          isOpen={isVerifyModalOpen}
          onClose={() => {
            setIsVerifyModalOpen(false);
            setSelectedDoctor(null);
          }}
          title="Confirm Verify"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsVerifyModalOpen(false);
                  setSelectedDoctor(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyDoctor}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300"
              >
                Verify
              </button>
            </div>
          }
        >
          <p className="text-white">
            Are you sure you want to verify {selectedDoctor.name}?
          </p>
        </Modal>
      )}
    </div>
  );
};

export default AdminManageDoctors;