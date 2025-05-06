import React, { useState, useEffect } from 'react';
import defaultAvatar from '/images/avatar.png';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  fetchVerifiedDoctorsThunk,
} from '../../redux/thunks/doctorThunk';
import { getImageUrl } from '../../utils/config';
import {
  clearError as clearDoctorError,
} from '../../redux/slices/doctorSlice';

interface Filters {
  searchQuery: string;
  speciality: string;
  ageRange: string;
  gender: string;
}

const ITEMS_PER_PAGE = 5;

const FindDoctor: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { doctors, error: doctorError } =
    useAppSelector((state) => state.doctors);

  const specialities = Array.from(
    new Set(doctors.map((doctor) => doctor.speciality).filter(Boolean))
  ).sort();

  const [filters, setFilters] = useState<Filters>({
    searchQuery: '',
    speciality: '',
    ageRange: '',
    gender: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchVerifiedDoctorsThunk());
  }, [dispatch]);

  useEffect(() => {
    if (doctorError) {
      toast.error(doctorError);
      dispatch(clearDoctorError());
    }
  }, [doctorError, dispatch]);

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = doctor.name
      .toLowerCase()
      .includes(filters.searchQuery.toLowerCase());
    const matchesSpeciality = filters.speciality
      ? doctor.speciality?.toLowerCase() === filters.speciality.toLowerCase()
      : true;
    const matchesGender = filters.gender
      ? doctor.gender?.toLowerCase() === filters.gender.toLowerCase()
      : true;
    const matchesAge = filters.ageRange
      ? (() => {
          const age = parseInt(doctor.age || '0');
          switch (filters.ageRange) {
            case '0-30':
              return age <= 30;
            case '31-50':
              return age > 30 && age <= 50;
            case '51+':
              return age > 50;
            default:
              return true;
          }
        })()
      : true;
    return matchesSearch && matchesSpeciality && matchesGender && matchesAge;
  });

  const totalPages = Math.ceil(filteredDoctors.length / ITEMS_PER_PAGE);
  const paginatedDoctors = filteredDoctors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = (name: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8">
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="container mx-auto px-4">
        <div className="bg-white/10 backdrop-blur-lg py-8 rounded-2xl border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6 text-center">
            Find a Doctor
          </h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <input
              type="text"
              placeholder="Find doctors by name"
              className="w-full md:w-2/3 p-4 bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={filters.searchQuery}
              onChange={(e) =>
                handleFilterChange('searchQuery', e.target.value)
              }
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
              >
                <option value="" className="bg-purple-900 text-white">
                  All Specialities
                </option>
                {specialities.map((spec) => (
                  <option
                    key={spec}
                    value={spec}
                    className="bg-purple-900 text-white"
                  >
                    {spec}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-gray-200 text-sm mb-2">
                Age Range
              </label>
              <select
                value={filters.ageRange}
                onChange={(e) => handleFilterChange('ageRange', e.target.value)}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none"
              >
                <option value="" className="bg-purple-900 text-white">
                  All Ages
                </option>
                <option value="0-30" className="bg-purple-900 text-white">
                  0-30
                </option>
                <option value="31-50" className="bg-purple-900 text-white">
                  31-50
                </option>
                <option value="51+" className="bg-purple-900 text-white">
                  51+
                </option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-gray-200 text-sm mb-2">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none"
              >
                <option value="" className="bg-purple-900 text-white">
                  All Genders
                </option>
                <option value="Male" className="bg-purple-900 text-white">
                  Male
                </option>
                <option value="Female" className="bg-purple-900 text-white">
                  Female
                </option>
                <option value="Other" className="bg-purple-900 text-white">
                  Other
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

            <div className="space-y-6">
              {paginatedDoctors.map((doctor) => (
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
                      <p className="text-sm text-gray-300 mb-4">
                        {doctor.availability || 'Availability TBD'}
                      </p>
                      <button
                        onClick={() => navigate(`/patient/doctors/${doctor._id}`)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm py-2 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

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