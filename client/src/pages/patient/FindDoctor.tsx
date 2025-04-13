import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchVerifiedDoctors } from '../../redux/thunks/doctorThunk';
import { API_BASE_URL } from '../../utils/config';
import defaultAvatar from '/images/avatar.png';
import { useNavigate } from 'react-router-dom';

interface Filters {
  availableToday: boolean;
  searchQuery: string;
  speciality: string;
  ageRange: string;
  gender: string;
}

const ITEMS_PER_PAGE = 5;

const SPECIALITIES = [
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Dermatology',
  'Oncology',
  'General Practice',
  'Psychiatry',
  'Gynecology',
  'Other',
];

const FindDoctor: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { doctors, loading, error } = useAppSelector((state) => state.doctors);
  const [filters, setFilters] = useState<Filters>({
    availableToday: false,
    searchQuery: '',
    speciality: '',
    ageRange: '',
    gender: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchVerifiedDoctors());
  }, [dispatch]);

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = doctor.name
      .toLowerCase()
      .includes(filters.searchQuery.toLowerCase());
    const matchesAvailability = filters.availableToday
      ? doctor.availability?.toLowerCase().includes('today')
      : true;
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
    return (
      matchesSearch &&
      matchesAvailability &&
      matchesSpeciality &&
      matchesGender &&
      matchesAge
    );
  });

  const totalPages = Math.ceil(filteredDoctors.length / ITEMS_PER_PAGE);
  const paginatedDoctors = filteredDoctors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFilterChange = (name: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-300"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 flex items-center justify-center">
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
              <p className="text-sm">{error}</p>
              <button
                onClick={() => dispatch(fetchVerifiedDoctors())}
                className="mt-2 text-sm text-purple-300 hover:text-purple-200 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8">
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
                Availability
              </label>
              <div className="flex items-center">
                <div
                  className={`w-6 h-6 border-2 rounded ${filters.availableToday ? 'border-purple-400 bg-purple-400' : 'border-white/20 bg-white/10'} flex items-center justify-center mr-2 cursor-pointer`}
                  onClick={() =>
                    handleFilterChange(
                      'availableToday',
                      !filters.availableToday
                    )
                  }
                >
                  {filters.availableToday && (
                    <div className="w-3 h-3 bg-white rounded-sm"></div>
                  )}
                </div>
                <span
                  className="text-gray-200 text-sm cursor-pointer"
                  onClick={() =>
                    handleFilterChange(
                      'availableToday',
                      !filters.availableToday
                    )
                  }
                >
                  Available today
                </span>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-gray-200 text-sm mb-2">
                Speciality
              </label>
              <select
                value={filters.speciality}
                onChange={(e) =>
                  handleFilterChange('speciality', e.target.value)
                }
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">All Specialities</option>
                {SPECIALITIES.map((spec) => (
                  <option key={spec} value={spec}>
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
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">All Ages</option>
                <option value="0-30">0-30</option>
                <option value="31-50">31-50</option>
                <option value="51+">51+</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-gray-200 text-sm mb-2">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
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
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <img
                        src={
                          doctor.profilePicture
                            ? `${API_BASE_URL}${doctor.profilePicture}`
                            : defaultAvatar
                        }
                        alt={doctor.name}
                        className="w-[150px] h-[150px] rounded-full object-cover shadow-lg border-4 border-purple-500/50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultAvatar;
                        }}
                      />
                      <div className="mt-2 text-center">
                        <span className="text-xs text-purple-300 bg-purple-500/20 py-1 px-3 rounded-full">
                          {doctor.availability || 'Availability TBD'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">
                        Dr. {doctor.name}
                      </h3>
                      <p className="text-sm text-purple-300 mb-2">
                        {doctor.speciality || 'Speciality N/A'}
                      </p>
                      <p className="text-sm text-gray-200 mb-2">
                        Qualifications:{' '}
                        {doctor.qualifications?.join(', ') || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-300 mb-4">
                        Age: {doctor.age || 'N/A'} | Gender:{' '}
                        {doctor.gender || 'N/A'}
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            navigate(`/patient/book-appointment/${doctor._id}`)
                          }
                          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm py-2 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                          Book Appointment
                        </button>
                        <button className="border border-purple-400 text-purple-300 font-bold text-sm py-2 px-6 rounded-lg hover:bg-purple-400/20 transition-all duration-300">
                          View Profile
                        </button>
                      </div>
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
