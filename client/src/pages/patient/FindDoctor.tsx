/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import defaultAvatar from '/images/avatar.png';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchVerifiedDoctorsThunk } from '../../redux/thunks/doctorThunk';
import { getImageUrl } from '../../utils/config';
import { clearError as clearDoctorError } from '../../redux/slices/doctorSlice';
import api from '../../services/api';
import SearchBar from '../../components/common/SearchBar';

interface Filters {
  searchQuery: string;
  speciality: string;
  experience: string;
  gender: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  availabilityStart?: string;
  availabilityEnd?: string;
  minRating?: number;
}

const ITEMS_PER_PAGE = 5;

const FindDoctor: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    doctors,
    totalItems,
    error: doctorError,
    loading,
  } = useAppSelector((state) => state.doctors);
  const [specialities, setSpecialities] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({
    searchQuery: '',
    speciality: '',
    experience: '',
    gender: '',
    sortBy: 'name',
    sortOrder: 'asc',
    availabilityStart: '',
    availabilityEnd: '',
    minRating: undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchSpecialities = async () => {
      try {
        const response = await api.get('/api/patients/specialities');
        setSpecialities(
          response.data.map((spec: { name: string }) => spec.name)
        );
      } catch (error) {
        toast.error('Failed to fetch specialities');
      }
    };
    fetchSpecialities();
  }, []);

  useEffect(() => {
    const params = {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: filters.searchQuery || undefined,
      speciality: filters.speciality || undefined,
      experience: filters.experience || undefined,
      gender: filters.gender || undefined,
      sortBy: filters.sortBy || undefined,
      sortOrder: filters.sortOrder || undefined,
      availabilityStart: filters.availabilityStart || undefined,
      availabilityEnd: filters.availabilityEnd || undefined,
      minRating:
        filters.minRating !== undefined ? Number(filters.minRating) : undefined,
    };
    dispatch(fetchVerifiedDoctorsThunk(params));
  }, [dispatch, currentPage, filters]);

  useEffect(() => {
    if (doctorError) {
      toast.error(doctorError);
      dispatch(clearDoctorError());
    }
  }, [doctorError, dispatch]);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const handleFilterChange = (name: keyof Filters, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [name]:
        name === 'minRating' ? (value ? Number(value) : undefined) : value,
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const dropdownStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
    backgroundPosition: 'right 0.75rem center',
    backgroundSize: '1.25rem',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8">
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="container mx-auto px-4">
        <div className="bg-white/10 backdrop-blur-lg py-8 rounded-2xl border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6 text-center">
            Find a Doctor
          </h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <SearchBar
              value={filters.searchQuery}
              onChange={(value) => handleFilterChange('searchQuery', value)}
              placeholder="Find doctors by name"
              className="w-full md:w-2/3 p-4 bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-8 rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl">
              Search
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div
            className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-[300px] bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-2xl`}
          >
            <h3 className="text-lg font-bold text-white mb-6 bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
              Filters
            </h3>
            <div className="mb-6">
              <label className="block text-gray-200 text-sm mb-2">
                Speciality
              </label>
              <select
                value={filters.speciality}
                onChange={(e) =>
                  handleFilterChange('speciality', e.target.value)
                }
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none"
                style={dropdownStyle}
              >
                <option value="" className="bg-gray-800 text-white">
                  All Specialities
                </option>
                {specialities.map((spec) => (
                  <option
                    key={spec}
                    value={spec}
                    className="bg-gray-800 text-white"
                  >
                    {spec}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-gray-200 text-sm mb-2">
                Total Experience
              </label>
              <select
                value={filters.experience}
                onChange={(e) =>
                  handleFilterChange('experience', e.target.value)
                }
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none"
                style={dropdownStyle}
              >
                <option value="" className="bg-gray-800 text-white">
                  All Experience Levels
                </option>
                <option value="0-5" className="bg-gray-800 text-white">
                  0-5 Years
                </option>
                <option value="6-10" className="bg-gray-800 text-white">
                  6-10 Years
                </option>
                <option value="11+" className="bg-gray-800 text-white">
                  11+ Years
                </option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-gray-200 text-sm mb-2">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none"
                style={dropdownStyle}
              >
                <option value="" className="bg-gray-800 text-white">
                  All Genders
                </option>
                <option value="Male" className="bg-gray-800 text-white">
                  Male
                </option>
                <option value="Female" className="bg-gray-800 text-white">
                  Female
                </option>
                <option value="Other" className="bg-gray-800 text-white">
                  Other
                </option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-gray-200 text-sm mb-2">
                Minimum Rating
              </label>
              <select
                value={filters.minRating ?? ''}
                onChange={(e) =>
                  handleFilterChange('minRating', e.target.value)
                }
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none"
                style={dropdownStyle}
              >
                <option value="" className="bg-gray-800 text-white">
                  All Ratings
                </option>
                <option value="1" className="bg-gray-800 text-white">
                  1+ Stars
                </option>
                <option value="2" className="bg-gray-800 text-white">
                  2+ Stars
                </option>
                <option value="3" className="bg-gray-800 text-white">
                  3+ Stars
                </option>
                <option value="4" className="bg-gray-800 text-white">
                  4+ Stars
                </option>
                <option value="5" className="bg-gray-800 text-white">
                  5 Stars
                </option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-gray-200 text-sm mb-2">
                Availability Start Date
              </label>
              <input
                type="date"
                value={filters.availabilityStart ?? ''}
                onChange={(e) =>
                  handleFilterChange('availabilityStart', e.target.value)
                }
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-200 text-sm mb-2">
                Availability End Date
              </label>
              <input
                type="date"
                value={filters.availabilityEnd ?? ''}
                onChange={(e) =>
                  handleFilterChange('availabilityEnd', e.target.value)
                }
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-200 text-sm mb-2">
                Sort By
              </label>
              <select
                value={`${filters.sortBy}:${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split(':') as [
                    string,
                    'asc' | 'desc',
                  ];
                  setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
                  setCurrentPage(1);
                }}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none"
                style={dropdownStyle}
              >
                <option value="name:asc" className="bg-gray-800 text-white">
                  Name (A-Z)
                </option>
                <option value="name:desc" className="bg-gray-800 text-white">
                  Name (Z-A)
                </option>
                <option
                  value="totalExperience:asc"
                  className="bg-gray-800 text-white"
                >
                  Total Experience (Low to High)
                </option>
                <option
                  value="totalExperience:desc"
                  className="bg-gray-800 text-white"
                >
                  Total Experience (High to Low)
                </option>
                <option
                  value="averageRating:desc"
                  className="bg-gray-800 text-white"
                >
                  Rating (High to Low)
                </option>
                <option
                  value="averageRating:asc"
                  className="bg-gray-800 text-white"
                >
                  Rating (Low to High)
                </option>
              </select>
            </div>
          </div>

          <div className="flex-1">
            <div className="md:hidden mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-white/20 border border-white/20 w-full py-3 px-4 flex justify-between items-center text-white rounded-lg"
              >
                <span className="font-medium">Filters</span>
                <span>{showFilters ? '▲' : '▼'}</span>
              </button>
            </div>

            {loading ? (
              <div className="text-white text-center">Loading...</div>
            ) : doctors.length === 0 ? (
              <div className="text-white text-center">No doctors found</div>
            ) : (
              <div className="space-y-6">
                {doctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    className="bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-2xl hover:shadow-2xl hover:from-white/20 hover:to-white/30 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex flex-col sm:flex-row gap-6 items-center">
                      <div className="flex-shrink-0">
                        <img
                          src={getImageUrl(doctor.profilePicture)}
                          alt={doctor.name}
                          className="w-[100px] h-[100px] rounded-full object-cover shadow-lg border-4 border-purple-500/50"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = defaultAvatar;
                          }}
                        />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-lg font-bold text-white mb-1">
                          Dr. {doctor.name}
                        </h3>
                        <p className="text-sm text-purple-300 mb-2">
                          {doctor.speciality || 'Speciality N/A'}
                        </p>
                        <p className="text-sm text-gray-300 mb-2">
                          Total Experience: {doctor.totalExperience || 0} years
                        </p>
                        <div className="flex items-center justify-center sm:justify-start mb-2">
                          <p className="text-sm text-gray-300 mr-2">Rating:</p>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-lg ${
                                  doctor.averageRating !== undefined &&
                                  doctor.averageRating >= star - 0.5
                                    ? 'text-yellow-400'
                                    : 'text-gray-400'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-gray-300 ml-2">
                            {doctor.averageRating !== undefined
                              ? doctor.averageRating.toFixed(1)
                              : 'No ratings'}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            navigate(`/patient/doctors/${doctor._id}`, {
                              state: { speciality: doctor.speciality },
                            })
                          }
                          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm py-2 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                          : 'bg-white/20 border border-white/20 text-gray-200 hover:bg-white/30'
                      } transition-all duration-300`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindDoctor;
