import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  getAllSpecialitiesThunk,
  createSpecialityThunk,
  updateSpecialityThunk,
  deleteSpecialityThunk,
} from '../../redux/thunks/adminThunk';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { Speciality } from '../../types/authTypes';
import { toast } from 'react-toastify';

const AdminSpecialityManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    specialities = [],
    loading,
    error,
    totalPages: totalPagesFromState,
  } = useAppSelector((state) => state.admin);
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSpeciality, setSelectedSpeciality] =
    useState<Speciality | null>(null);
  const [specialityName, setSpecialityName] = useState('');
  const itemsPerPage = 5;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      dispatch(
        getAllSpecialitiesThunk({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
        })
      );
    }
  }, [dispatch, user?.role, currentPage, searchTerm]);

  useEffect(() => {
    setTotalPages(totalPagesFromState.specialities);
  }, [totalPagesFromState.specialities]);

  const handleCreateOrUpdateSpeciality = useCallback(async () => {
    if (!specialityName.trim()) {
      toast.error('Speciality name is required');
      return;
    }
    try {
      if (selectedSpeciality) {
        await dispatch(
          updateSpecialityThunk({
            id: selectedSpeciality._id,
            name: specialityName,
          })
        ).unwrap();
        toast.success('Speciality updated successfully');
      } else {
        await dispatch(createSpecialityThunk(specialityName)).unwrap();
        toast.success('Speciality created successfully');
      }
      setIsModalOpen(false);
      setSpecialityName('');
      setSelectedSpeciality(null);
    } catch (err) {
      toast.error(
        `Failed to ${selectedSpeciality ? 'update' : 'create'} speciality: ${err}`
      );
    }
  }, [dispatch, selectedSpeciality, specialityName]);

  const handleEditSpeciality = useCallback((speciality: Speciality) => {
    setSelectedSpeciality(speciality);
    setSpecialityName(speciality.name);
    setIsModalOpen(true);
  }, []);

  const handleDeleteSpeciality = useCallback(
    async (speciality: Speciality) => {
      if (window.confirm('Are you sure you want to delete this speciality?')) {
        try {
          await dispatch(deleteSpecialityThunk(speciality._id)).unwrap();
          toast.success('Speciality deleted successfully');
        } catch (err) {
          toast.error(`Failed to delete speciality: ${err}`);
        }
      }
    },
    [dispatch]
  );

  const handleAddSpeciality = useCallback(() => {
    setSelectedSpeciality(null);
    setSpecialityName('');
    setIsModalOpen(true);
  }, []);

  const columns = useMemo(
    () => [
      {
        header: 'Name',
        accessor: (speciality: Speciality): React.ReactNode => {
          const maxLength = 20; // Maximum length for the specialty name
          const displayName =
            speciality.name && speciality.name.length > maxLength
              ? `${speciality.name.substring(0, maxLength)}...`
              : speciality.name || 'N/A';
          return (
            <span
              className="text-sm text-white truncate max-w-[150px]"
              title={speciality.name || 'N/A'}
            >
              {displayName}
            </span>
          );
        },
        className: 'align-middle',
      },
      {
        header: 'Created At',
        accessor: (speciality: Speciality): React.ReactNode =>
          new Date(speciality.createdAt).toLocaleDateString(),
      },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        label: 'Edit',
        onClick: handleEditSpeciality,
        className: 'bg-blue-600 hover:bg-blue-700',
      },
      {
        label: 'Delete',
        onClick: handleDeleteSpeciality,
        className: 'bg-red-600 hover:bg-red-700',
      },
    ],
    [handleEditSpeciality, handleDeleteSpeciality]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-lg p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
          Speciality Management
        </h2>
        <button
          onClick={handleAddSpeciality}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
        >
          Add Speciality
        </button>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <SearchBar
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search specialities..."
        />
      </div>
      <DataTable
        data={specialities}
        columns={columns}
        actions={actions}
        isLoading={loading}
        error={error}
        onRetry={() =>
          dispatch(
            getAllSpecialitiesThunk({
              page: currentPage,
              limit: itemsPerPage,
              search: searchTerm,
            })
          )
        }
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSpeciality ? 'Edit Speciality' : 'Add Speciality'}
        footer={
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateOrUpdateSpeciality}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
            >
              {selectedSpeciality ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Speciality name"
          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          value={specialityName}
          onChange={(e) => setSpecialityName(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default AdminSpecialityManagement;
