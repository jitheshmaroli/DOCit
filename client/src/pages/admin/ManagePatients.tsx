import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';

import { formatDate } from '../../utils/helpers';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { blockPatientThunk, createPatientThunk, deletePatientThunk, listPatientsThunk, updatePatientThunk } from '../../redux/thunks/adminThunk';

const ITEMS_PER_PAGE = 5;

const ManagePatients: React.FC = () => {
  const dispatch = useAppDispatch();
  const { patients, loading, error } = useAppSelector((state) => state.admin);
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editPatient, setEditPatient] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      dispatch(listPatientsThunk());
    }
  }, [dispatch, user?.role]);

  const handleCreatePatient = async () => {
    try {
      await dispatch(createPatientThunk(newPatient)).unwrap();
      toast.success('Patient created successfully');
      setIsModalOpen(false);
      setNewPatient({ email: '', password: '', name: '', phone: '' });
      dispatch(listPatientsThunk());
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to create patient');
    }
  };

  const handleUpdatePatient = async () => {
    if (!editPatient) return;
    try {
      await dispatch(
        updatePatientThunk({ id: editPatient._id, updates: editPatient })
      ).unwrap();
      toast.success('Patient updated successfully');
      setEditPatient(null);
      dispatch(listPatientsThunk());
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to update patient');
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await dispatch(deletePatientThunk(id)).unwrap();
        toast.success('Patient deleted successfully');
        dispatch(listPatientsThunk());
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error('Failed to delete patient');
      }
    }
  };

  const handleBlockPatient = async (id: string, isBlocked: boolean) => {
    const action = isBlocked ? 'unblock' : 'block';
    if (window.confirm(`Are you sure you want to ${action} this patient?`)) {
      try {
        await dispatch(blockPatientThunk({ id, isBlocked: !isBlocked })).unwrap();
        toast.success(`Patient ${action}ed successfully`);
        dispatch(listPatientsThunk());
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error(`Failed to ${action} patient`);
      }
    }
  };

  const getBackgroundColor = (id: string) => {
    const colors = ['purple', 'blue', 'indigo', 'violet', 'fuchsia'];
    const colorIndex = id.charCodeAt(0) % colors.length;
    const colorMap: Record<string, string> = {
      purple: 'bg-purple-500/20 text-purple-300',
      blue: 'bg-blue-500/20 text-blue-300',
      indigo: 'bg-indigo-500/20 text-indigo-300',
      violet: 'bg-violet-500/20 text-violet-300',
      fuchsia: 'bg-fuchsia-500/20 text-fuchsia-300',
    };
    return colorMap[colors[colorIndex]] || 'bg-gray-500/20 text-gray-300';
  };

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'blocked' && patient.isBlocked) ||
      (statusFilter === 'active' && !patient.isBlocked) ||
      (statusFilter === 'subscribed' && patient.isSubscribed);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading && patients.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-300"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border-l-4 border-red-500 p-4 rounded-lg text-white">
        <div className="flex items-center">
          <svg
            className="h-5 w-5 text-red-300 mr-3"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-sm">Error: {error}</p>
            <button
              onClick={() => dispatch(listPatientsThunk())}
              className="mt-2 text-sm text-purple-300 hover:text-purple-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="bg-white/10 backdrop-blur-lg p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <input
            type="text"
            placeholder="Search patients..."
            className="w-full md:w-1/3 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            <select
              className="w-full md:w-48 p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="subscribed">Subscribed</option>
            </select>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              + Add Patient
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white/20 backdrop-blur-lg border border-white/20 rounded-lg">
            <thead>
              <tr className="bg-white/10 border-b border-white/20">
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Joined Date
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {paginatedPatients.map((patient) => {
                const initials = patient.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase();
                return (
                  <tr
                    key={patient._id}
                    className="hover:bg-white/30 transition-all duration-300"
                  >
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${getBackgroundColor(patient._id)}`}
                        >
                          {initials}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {patient.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {patient.email}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {patient.phone}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {formatDate(patient.createdAt)}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${patient.isSubscribed ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}
                        >
                          {patient.isSubscribed
                            ? 'Subscribed'
                            : 'Not Subscribed'}
                        </span>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${patient.isBlocked ? 'bg-red-500/20 text-red-300' : 'bg-gray-500/20 text-gray-300'}`}
                        >
                          {patient.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setEditPatient(patient)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePatient(patient._id)}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-all duration-300"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() =>
                          handleBlockPatient(patient._id, patient.isBlocked)
                        }
                        className={`text-white px-3 py-1 rounded-lg transition-all duration-300 ${patient.isBlocked ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                      >
                        {patient.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {paginatedPatients.length === 0 && (
            <div className="text-center py-12 text-gray-200">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-white">
                No patients found
              </h3>
              <p className="mt-1 text-sm">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No patients in the system yet'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-purple-600 text-white rounded-lg disabled:bg-gray-600 hover:bg-purple-700 transition-all duration-300"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-purple-600 text-white rounded-lg disabled:bg-gray-600 hover:bg-purple-700 transition-all duration-300"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Add Patient</h2>
            <input
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
            <div className="flex justify-end space-x-2">
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
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {editPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Edit Patient</h2>
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
            <div className="flex justify-end space-x-2">
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
          </div>
        </div>
      )}
    </>
  );
};

export default ManagePatients;
