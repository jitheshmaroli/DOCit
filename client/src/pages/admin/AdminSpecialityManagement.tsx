import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  getAllSpecialitiesThunk,
  createSpecialityThunk,
  updateSpecialityThunk,
  deleteSpecialityThunk,
} from '../../redux/thunks/adminThunk';
import { Speciality } from '../../types/authTypes';

const AdminSpecialityManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { specialities = [], loading, error } = useAppSelector((state) => state.admin);
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSpeciality, setSelectedSpeciality] = useState<Speciality | null>(null);
  const [specialityName, setSpecialityName] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      dispatch(getAllSpecialitiesThunk());
    }
  }, [dispatch, user?.role]);

  const handleCreateOrUpdateSpeciality = async () => {
    if (!specialityName.trim()) {
      toast.error('Speciality name is required');
      return;
    }
    try {
      if (selectedSpeciality) {
        await dispatch(updateSpecialityThunk({ id: selectedSpeciality._id, name: specialityName })).unwrap();
        toast.success('Speciality updated successfully');
      } else {
        await dispatch(createSpecialityThunk(specialityName)).unwrap();
        toast.success('Speciality created successfully');
      }
      setIsModalOpen(false);
      setSpecialityName('');
      setSelectedSpeciality(null);
    } catch (error) {
      toast.error(`Failed to ${selectedSpeciality ? 'update' : 'create'} speciality: ${error}`);
    }
  };

  const handleEditSpeciality = (speciality: Speciality) => {
    setSelectedSpeciality(speciality);
    setSpecialityName(speciality.name);
    setIsModalOpen(true);
  };

  const handleDeleteSpeciality = async (specialityId: string) => {
    if (window.confirm('Are you sure you want to delete this speciality?')) {
      try {
        await dispatch(deleteSpecialityThunk(specialityId)).unwrap();
        toast.success('Speciality deleted successfully');
      } catch (error) {
        toast.error(`Failed to delete speciality: ${error}`);
      }
    }
  };

  const filteredSpecialities = Array.isArray(specialities)
    ? specialities.filter((speciality): speciality is NonNullable<Speciality> => {
        if (!speciality || !speciality._id || !speciality.name) {
          console.warn('Invalid speciality:', speciality);
          return false;
        }
        return speciality.name.toLowerCase().includes(searchTerm.toLowerCase()) || !searchTerm;
      })
    : [];

  if (loading && (!specialities || specialities.length === 0)) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-300"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border-l-4 border-red-500 p-4 rounded-lg text-white">
        <p className="text-sm">Error: {error}</p>
        <button
          onClick={() => dispatch(getAllSpecialitiesThunk())}
          className="mt-2 text-sm text-purple-300 hover:text-purple-200 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="bg-white/10 backdrop-blur-lg p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
            Speciality Management
          </h2>
          <button
            onClick={() => {
              setSelectedSpeciality(null);
              setSpecialityName('');
              setIsModalOpen(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
          >
            Add Speciality
          </button>
        </div>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search specialities..."
            className="w-full md:w-1/3 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white/20 backdrop-blur-lg border border-white/20 rounded-lg">
            <thead>
              <tr className="bg-white/10 border-b border-white/20">
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {filteredSpecialities.length > 0 ? (
                filteredSpecialities.map((speciality) => (
                  <tr
                    key={speciality._id}
                    className="hover:bg-white/30 transition-all duration-300"
                  >
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">
                      {speciality.name}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {new Date(speciality.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleEditSpeciality(speciality)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSpeciality(speciality._id)}
                        className="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 md:px-6 py-4 text-center text-gray-200"
                  >
                    No specialities found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              {selectedSpeciality ? 'Edit Speciality' : 'Add Speciality'}
            </h3>
            <input
              type="text"
              placeholder="Speciality name"
              className="w-full p-3 mb-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={specialityName}
              onChange={(e) => setSpecialityName(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrUpdateSpeciality}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
              >
                {selectedSpeciality ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSpecialityManagement;