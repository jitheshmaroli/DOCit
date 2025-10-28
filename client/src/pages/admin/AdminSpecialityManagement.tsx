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
import { validateName } from '../../utils/validation';
import { showSuccess, showError } from '../../utils/toastConfig';

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSpeciality, setSelectedSpeciality] =
    useState<Speciality | null>(null);
  const [specialityName, setSpecialityName] = useState('');
  const [formError, setFormError] = useState('');
  const itemsPerPage = 5;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      dispatch(
        getAllSpecialitiesThunk({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm.trim(),
        })
      );
    }
  }, [dispatch, user?.role, currentPage, searchTerm]);

  useEffect(() => {
    setTotalPages(totalPagesFromState.specialities);
  }, [totalPagesFromState.specialities]);

  const validateForm = useCallback(() => {
    const error = validateName(specialityName) || '';
    setFormError(error);
    return !error;
  }, [specialityName]);

  const handleCreateOrUpdateSpeciality = useCallback(async () => {
    if (!validateForm()) {
      showError('Please fix the form error');
      return;
    }
    try {
      if (selectedSpeciality) {
        await dispatch(
          updateSpecialityThunk({
            id: selectedSpeciality._id,
            specialityName,
          })
        ).unwrap();
        await showSuccess('Speciality updated successfully');
      } else {
        await dispatch(createSpecialityThunk(specialityName)).unwrap();
        await showSuccess('Speciality created successfully');
      }
      setIsModalOpen(false);
      setSpecialityName('');
      setSelectedSpeciality(null);
      setFormError('');
    } catch (err) {
      await showError(
        `Failed to ${selectedSpeciality ? 'update' : 'create'} speciality: ${err}`
      );
    }
  }, [dispatch, selectedSpeciality, specialityName, validateForm]);

  const handleEditSpeciality = useCallback((speciality: Speciality) => {
    setSelectedSpeciality(speciality);
    setSpecialityName(speciality.name);
    setIsModalOpen(true);
  }, []);

  const handleDeleteSpeciality = useCallback(
    async () => {
      if (!selectedSpeciality) return;
      try {
        await dispatch(deleteSpecialityThunk(selectedSpeciality._id)).unwrap();
        await showSuccess('Speciality deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedSpeciality(null);
      } catch (err) {
        await showError(`Failed to delete speciality: ${err}`);
        setIsDeleteModalOpen(false);
        setSelectedSpeciality(null);
      }
    },
    [dispatch, selectedSpeciality]
  );

  const handleAddSpeciality = useCallback(() => {
    setSelectedSpeciality(null);
    setSpecialityName('');
    setIsModalOpen(true);
    setFormError('');
  }, []);

  const columns = useMemo(
    () => [
      {
        header: 'Name',
        accessor: (speciality: Speciality): React.ReactNode => {
          const maxLength = 20;
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
        onClick: (speciality: Speciality) => {
          setSelectedSpeciality(speciality);
          setIsDeleteModalOpen(true);
        },
        className: 'bg-red-600 hover:bg-red-700',
      },
    ],
    [handleEditSpeciality]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term.trim());
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
              search: searchTerm.trim(),
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
        onClose={() => {
          setIsModalOpen(false);
          setFormError('');
        }}
        title={selectedSpeciality ? 'Edit Speciality' : 'Add Speciality'}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setFormError('');
              }}
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
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Speciality name"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={specialityName}
              onChange={(e) => {
                setSpecialityName(e.target.value);
                setFormError(validateName(e.target.value) || '');
              }}
            />
            {formError && (
              <p className="text-red-400 text-xs mt-1">{formError}</p>
            )}
          </div>
        </div>
      </Modal>
      {isDeleteModalOpen && selectedSpeciality && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedSpeciality(null);
          }}
          title="Confirm Delete"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedSpeciality(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSpeciality}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300"
              >
                Delete
              </button>
            </div>
          }
        >
          <p className="text-white">
            Are you sure you want to delete the speciality "{selectedSpeciality.name || 'Unknown'}"?
          </p>
        </Modal>
      )}
    </div>
  );
};

export default AdminSpecialityManagement;