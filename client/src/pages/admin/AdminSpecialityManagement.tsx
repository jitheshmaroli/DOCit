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
import { Tag, Plus, AlertTriangle } from 'lucide-react';

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
          updateSpecialityThunk({ id: selectedSpeciality._id, specialityName })
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

  const handleDeleteSpeciality = useCallback(async () => {
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
  }, [dispatch, selectedSpeciality]);

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
              className="text-sm font-medium text-text-primary truncate max-w-[150px]"
              title={speciality.name || 'N/A'}
            >
              {displayName}
            </span>
          );
        },
      },
      {
        header: 'Created',
        accessor: (speciality: Speciality): React.ReactNode => (
          <span className="text-sm text-text-secondary">
            {new Date(speciality.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        label: 'Edit',
        onClick: handleEditSpeciality,
        className: 'btn-secondary text-xs px-3 py-1.5',
      },
      {
        label: 'Delete',
        onClick: (speciality: Speciality) => {
          setSelectedSpeciality(speciality);
          setIsDeleteModalOpen(true);
        },
        className: 'btn-danger text-xs px-3 py-1.5',
      },
    ],
    [handleEditSpeciality]
  );

  const handlePageChange = useCallback(
    (page: number) => setCurrentPage(page),
    []
  );
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term.trim());
    setCurrentPage(1);
  }, []);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-50 flex items-center justify-center">
            <Tag size={18} className="text-accent-600" />
          </div>
          <div>
            <h1 className="page-title">Speciality Management</h1>
            <p className="page-subtitle">
              Manage medical specialities available on the platform
            </p>
          </div>
        </div>
        <button onClick={handleAddSpeciality} className="btn-primary">
          <Plus size={16} />
          Add Speciality
        </button>
      </div>

      <div className="card">
        <SearchBar
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search specialities..."
        />
      </div>

      <div className="card p-0 overflow-hidden">
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
        <div className="border-t border-surface-border px-4 py-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Add / Edit Modal */}
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
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateOrUpdateSpeciality}
              className="btn-primary"
            >
              {selectedSpeciality ? 'Save Changes' : 'Create'}
            </button>
          </div>
        }
      >
        <div>
          <label className="label">Speciality Name</label>
          <input
            ref={inputRef}
            type="text"
            placeholder="e.g. Cardiology"
            className={`input ${formError ? 'input-error' : ''}`}
            value={specialityName}
            onChange={(e) => {
              setSpecialityName(e.target.value);
              setFormError(validateName(e.target.value) || '');
            }}
          />
          {formError && <p className="error-text">{formError}</p>}
        </div>
      </Modal>

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedSpeciality && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedSpeciality(null);
          }}
          title="Delete Speciality"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedSpeciality(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleDeleteSpeciality} className="btn-danger">
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
              Permanently delete the speciality{' '}
              <span className="font-semibold text-text-primary">
                "{selectedSpeciality.name || 'Unknown'}"
              </span>
              ? This may affect doctors listed under this speciality.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminSpecialityManagement;
