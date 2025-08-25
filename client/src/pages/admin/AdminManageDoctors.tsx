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
import { toast } from 'react-toastify';
import { ITEMS_PER_PAGE } from '../../utils/constants';

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
        search: searchTerm,
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

  const handleCreateDoctor = useCallback(async () => {
    try {
      await dispatch(createDoctorThunk(newDoctor)).unwrap();
      toast.success('Doctor created successfully');
      setIsModalOpen(false);
      setNewDoctor({
        email: '',
        password: '',
        name: '',
        phone: '',
        licenseNumber: '',
      });
    } catch (err) {
      toast.error(`Failed to create doctor: ${err}`);
    }
  }, [dispatch, newDoctor]);

  const handleUpdateDoctor = useCallback(async () => {
    if (!editDoctor) return;
    try {
      await dispatch(
        updateDoctorThunk({ id: editDoctor._id, updates: editDoctor })
      ).unwrap();
      toast.success('Doctor updated successfully');
      setEditDoctor(null);
    } catch (err) {
      toast.error(`Failed to update doctor: ${err}`);
    }
  }, [dispatch, editDoctor]);

  const handleDeleteDoctor = useCallback(
    async (doctor: Doctor) => {
      if (window.confirm('Are you sure you want to delete this doctor?')) {
        try {
          await dispatch(deleteDoctorThunk(doctor._id)).unwrap();
          toast.success('Doctor deleted successfully');
        } catch (err) {
          toast.error(`Failed to delete doctor: ${err}`);
        }
      }
    },
    [dispatch]
  );

  const handleBlockDoctor = useCallback(
    async (doctor: Doctor) => {
      const action = doctor.isBlocked ? 'unblock' : 'block';
      if (window.confirm(`Are you sure you want to ${action} this doctor?`)) {
        try {
          await dispatch(
            blockDoctorThunk({ id: doctor._id, isBlocked: !doctor.isBlocked })
          ).unwrap();
          toast.success(`Doctor ${action}ed successfully`);
        } catch (err) {
          toast.error(`Failed to ${action} doctor: ${err}`);
        }
      }
    },
    [dispatch]
  );

  const handleVerifyDoctor = useCallback(
    async (doctor: Doctor) => {
      if (window.confirm('Are you sure you want to verify this doctor?')) {
        try {
          await dispatch(verifyDoctorThunk(doctor._id)).unwrap();
          toast.success('Doctor verified successfully');
        } catch (err) {
          toast.error(`Failed to verify doctor: ${err}`);
        }
      }
    },
    [dispatch]
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
                style={{ maxWidth: '150px' }} // Fixed maxWidth
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
              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                doctor.isVerified
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-gray-500/20 text-gray-300'
              }`}
            >
              {doctor.isVerified ? 'Verified' : 'Unverified'}
            </span>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                doctor.isBlocked
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-gray-500/20 text-gray-300'
              }`}
            >
              {doctor.isBlocked ? 'Blocked' : 'Active'}
            </span>
          </div>
        ),
        minWidth: '180px',
      },
    ],
    [] // Removed truncateMaxWidth from dependencies
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
        onClick: handleDeleteDoctor,
        className: 'bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg',
      },
      {
        label: 'Block',
        onClick: handleBlockDoctor,
        className: 'bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded-lg',
        condition: (doctor: Doctor) => !doctor.isBlocked,
      },
      {
        label: 'Unblock',
        onClick: handleBlockDoctor,
        className: 'bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg',
        condition: (doctor: Doctor) => doctor.isBlocked,
      },
      {
        label: 'Verify',
        onClick: handleVerifyDoctor,
        className: 'bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg',
        condition: (doctor: Doctor) => !doctor.isVerified,
      },
    ],
    [handleDeleteDoctor, handleBlockDoctor, handleVerifyDoctor]
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
    setSearchTerm(term);
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
            search: searchTerm,
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
        onClose={() => setIsModalOpen(false)}
        title="Add Doctor"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
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
        <input
          ref={inputRef}
          type="text"
          placeholder="Name"
          className="w-full p-3 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          value={newDoctor.name}
          onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          value={newDoctor.email}
          onChange={(e) =>
            setNewDoctor({ ...newDoctor, email: e.target.value })
          }
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          value={newDoctor.password}
          onChange={(e) =>
            setNewDoctor({ ...newDoctor, password: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Phone"
          className="w-full p-3 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          value={newDoctor.phone}
          onChange={(e) =>
            setNewDoctor({ ...newDoctor, phone: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="License Number"
          className="w-full p-3 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          value={newDoctor.licenseNumber}
          onChange={(e) =>
            setNewDoctor({ ...newDoctor, licenseNumber: e.target.value })
          }
        />
      </Modal>
      {editDoctor && (
        <Modal
          isOpen={!!editDoctor}
          onClose={() => setEditDoctor(null)}
          title="Edit Doctor"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditDoctor(null)}
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
          <input
            type="text"
            placeholder="Name"
            className="w-full p-3 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={editDoctor.name}
            onChange={(e) =>
              setEditDoctor({ ...editDoctor, name: e.target.value })
            }
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={editDoctor.email}
            onChange={(e) =>
              setEditDoctor({ ...editDoctor, email: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Phone"
            className="w-full p-3 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={editDoctor.phone}
            onChange={(e) =>
              setEditDoctor({ ...editDoctor, phone: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="License Number"
            className="w-full p-3 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={editDoctor.licenseNumber}
            onChange={(e) =>
              setEditDoctor({ ...editDoctor, licenseNumber: e.target.value })
            }
          />
          <div className="w-full p-3 mb-3">
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
        </Modal>
      )}
    </div>
  );
};

export default AdminManageDoctors;
