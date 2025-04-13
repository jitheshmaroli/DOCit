import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  listDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  blockDoctor,
  verifyDoctor,
} from '../../redux/thunks/adminThunk';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ITEMS_PER_PAGE = 5;

const ManageDoctors: React.FC = () => {
  const dispatch = useAppDispatch();
  const { doctors, loading, error } = useAppSelector((state) => state.admin);
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    licenseNumber: '',
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editDoctor, setEditDoctor] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      dispatch(listDoctors());
    }
  }, [dispatch, user?.role]);

  const handleCreateDoctor = async () => {
    try {
      await dispatch(createDoctor(newDoctor)).unwrap();
      toast.success('Doctor created successfully');
      setIsModalOpen(false);
      setNewDoctor({
        email: '',
        password: '',
        name: '',
        phone: '',
        licenseNumber: '',
      });
      dispatch(listDoctors());
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to create doctor');
    }
  };

  const handleUpdateDoctor = async () => {
    if (!editDoctor) return;
    try {
      await dispatch(
        updateDoctor({ id: editDoctor._id, updates: editDoctor })
      ).unwrap();
      toast.success('Doctor updated successfully');
      setEditDoctor(null);
      dispatch(listDoctors());
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to update doctor');
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await dispatch(deleteDoctor(id)).unwrap();
        toast.success('Doctor deleted successfully');
        dispatch(listDoctors());
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error('Failed to delete doctor');
      }
    }
  };

  const handleBlockDoctor = async (id: string, isBlocked: boolean) => {
    const action = isBlocked ? 'unblock' : 'block';
    if (window.confirm(`Are you sure you want to ${action} this doctor?`)) {
      try {
        await dispatch(blockDoctor({ id, isBlocked: !isBlocked })).unwrap();
        toast.success(`Doctor ${action}ed successfully`);
        dispatch(listDoctors());
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error(`Failed to ${action} doctor`);
      }
    }
  };

  const handleVerifyDoctor = async (id: string) => {
    if (window.confirm('Are you sure you want to verify this doctor?')) {
      try {
        await dispatch(verifyDoctor(id)).unwrap();
        toast.success('Doctor verified successfully');
        dispatch(listDoctors());
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error('Failed to verify doctor');
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

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'verified' && doctor.isVerified) ||
      (statusFilter === 'unverified' && !doctor.isVerified) ||
      (statusFilter === 'blocked' && doctor.isBlocked);
    const matchesSpecialty =
      specialtyFilter === 'all' ||
      doctor.speciality?.toLowerCase() === specialtyFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesSpecialty;
  });

  const totalPages = Math.ceil(filteredDoctors.length / ITEMS_PER_PAGE);
  const paginatedDoctors = filteredDoctors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading && doctors.length === 0) {
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
              onClick={() => dispatch(listDoctors())}
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
            placeholder="Search doctors..."
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
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
              <option value="blocked">Blocked</option>
            </select>
            <select
              className="w-full md:w-48 p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
            >
              <option value="all">All Specialties</option>
              <option value="general medicine">General Medicine</option>
              <option value="cardiology">Cardiology</option>
              <option value="neurology">Neurology</option>
            </select>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              + Add Doctor
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
                  License
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
              {paginatedDoctors.map((doctor) => {
                const initials = doctor.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase();
                return (
                  <tr
                    key={doctor._id}
                    className="hover:bg-white/30 transition-all duration-300"
                  >
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${getBackgroundColor(doctor._id)}`}
                        >
                          {initials}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {doctor.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {doctor.email}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {doctor.phone}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {doctor.licenseNumber}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doctor.isVerified ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}
                        >
                          {doctor.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doctor.isBlocked ? 'bg-red-500/20 text-red-300' : 'bg-gray-500/20 text-gray-300'}`}
                        >
                          {doctor.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setEditDoctor(doctor)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDoctor(doctor._id)}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-all duration-300"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() =>
                          handleBlockDoctor(doctor._id, doctor.isBlocked)
                        }
                        className={`text-white px-3 py-1 rounded-lg transition-all duration-300 ${doctor.isBlocked ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                      >
                        {doctor.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                      {!doctor.isVerified && (
                        <button
                          onClick={() => handleVerifyDoctor(doctor._id)}
                          className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-all duration-300"
                        >
                          Verify
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {paginatedDoctors.length === 0 && (
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
                No doctors found
              </h3>
              <p className="mt-1 text-sm">
                {searchTerm ||
                statusFilter !== 'all' ||
                specialtyFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No doctors in the system yet'}
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

      {/* Add Doctor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Add Doctor</h2>
            <input
              type="text"
              placeholder="Name"
              className="w-full p-3 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={newDoctor.name}
              onChange={(e) =>
                setNewDoctor({ ...newDoctor, name: e.target.value })
              }
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
            <div className="flex justify-end space-x-2">
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
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {editDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Edit Doctor</h2>
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
            <div className="flex justify-end space-x-2">
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
          </div>
        </div>
      )}
    </>
  );
};

export default ManageDoctors;
