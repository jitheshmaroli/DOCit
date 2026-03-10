import React, { useState, useEffect } from 'react';
import defaultAvatar from '/images/avatar.png';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchVerifiedDoctorsThunk } from '../../redux/thunks/doctorThunk';
import { getImageUrl } from '../../utils/config';
import SearchBar from '../../components/common/SearchBar';
import FilterSelect from '../../components/common/FilterSelect';
import Pagination from '../../components/common/Pagination';
import { fetchSpecialities } from '../../services/patientService';
import { ITEMS_PER_PAGE } from '../../utils/constants';
import { SlidersHorizontal, Star, Clock, X, Search } from 'lucide-react';

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

const SkeletonCard = () => (
  <div className="card p-6 animate-pulse">
    <div className="flex gap-5">
      <div className="w-20 h-20 rounded-2xl skeleton flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="h-5 skeleton rounded-lg w-40" />
        <div className="h-4 skeleton rounded-lg w-28" />
        <div className="h-4 skeleton rounded-lg w-32" />
        <div className="h-9 skeleton rounded-xl w-32" />
      </div>
    </div>
  </div>
);

const FindDoctor: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { doctors, totalItems, loading } = useAppSelector(
    (state) => state.doctors
  );
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
    fetchSpecialities().then((data) =>
      setSpecialities(data.map((s: { name: string }) => s.name))
    );
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

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const handleFilterChange = (name: keyof Filters, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [name]:
        name === 'minRating' ? (value ? Number(value) : undefined) : value,
    }));
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(
    filters.speciality ||
    filters.experience ||
    filters.gender ||
    filters.minRating ||
    filters.availabilityStart
  );

  const clearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      speciality: '',
      experience: '',
      gender: '',
      sortBy: 'name',
      sortOrder: 'asc',
      availabilityStart: '',
      availabilityEnd: '',
      minRating: undefined,
    }));
    setCurrentPage(1);
  };

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Find a Doctor</h1>
        <p className="page-subtitle">
          Search from {totalItems}+ verified specialists across specialties
        </p>
      </div>

      {/* Search */}
      <div className="card p-4 mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10"
            />
            <SearchBar
              value={filters.searchQuery}
              onChange={(value) => handleFilterChange('searchQuery', value)}
              placeholder="Search by doctor name..."
              className="pl-10"
            />
          </div>
          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`md:hidden btn-secondary flex items-center gap-2 ${
              showFilters
                ? 'bg-primary-50 border-primary-200 text-primary-600'
                : ''
            }`}
          >
            <SlidersHorizontal size={16} />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filter sidebar */}
        <aside
          className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-72 flex-shrink-0`}
        >
          <div className="card p-5 sticky top-24">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-text-secondary" />
                <h3 className="font-semibold text-text-primary text-sm">
                  Filters
                </h3>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  <X size={12} /> Clear all
                </button>
              )}
            </div>

            <div className="space-y-4">
              <FilterSelect
                label="Specialty"
                value={filters.speciality}
                onChange={(v) => handleFilterChange('speciality', v)}
                options={[
                  { value: '', label: 'All Specialties' },
                  ...specialities.map((s) => ({ value: s, label: s })),
                ]}
              />

              <FilterSelect
                label="Experience"
                value={filters.experience}
                onChange={(v) => handleFilterChange('experience', v)}
                options={[
                  { value: '', label: 'All Levels' },
                  { value: '0-5', label: '0–5 Years' },
                  { value: '6-10', label: '6–10 Years' },
                  { value: '11+', label: '11+ Years' },
                ]}
              />

              <FilterSelect
                label="Gender"
                value={filters.gender}
                onChange={(v) => handleFilterChange('gender', v)}
                options={[
                  { value: '', label: 'Any Gender' },
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
              />

              <FilterSelect
                label="Minimum Rating"
                value={String(filters.minRating ?? '')}
                onChange={(v) => handleFilterChange('minRating', v)}
                options={[
                  { value: '', label: 'All Ratings' },
                  { value: '3', label: '3+ Stars' },
                  { value: '4', label: '4+ Stars' },
                  { value: '5', label: '5 Stars Only' },
                ]}
              />

              <div>
                <label className="label">Availability From</label>
                <input
                  type="date"
                  value={filters.availabilityStart ?? ''}
                  onChange={(e) =>
                    handleFilterChange('availabilityStart', e.target.value)
                  }
                  className="input"
                />
              </div>

              <div>
                <label className="label">Availability To</label>
                <input
                  type="date"
                  value={filters.availabilityEnd ?? ''}
                  onChange={(e) =>
                    handleFilterChange('availabilityEnd', e.target.value)
                  }
                  className="input"
                />
              </div>

              <FilterSelect
                label="Sort By"
                value={`${filters.sortBy}:${filters.sortOrder}`}
                onChange={(v) => {
                  const [sortBy, sortOrder] = v.split(':') as [
                    string,
                    'asc' | 'desc',
                  ];
                  setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'name:asc', label: 'Name (A–Z)' },
                  { value: 'name:desc', label: 'Name (Z–A)' },
                  {
                    value: 'totalExperience:asc',
                    label: 'Experience (Low→High)',
                  },
                  {
                    value: 'totalExperience:desc',
                    label: 'Experience (High→Low)',
                  },
                  { value: 'averageRating:desc', label: 'Rating (High→Low)' },
                  { value: 'averageRating:asc', label: 'Rating (Low→High)' },
                ]}
              />
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {!loading && doctors.length > 0 && (
            <p className="text-sm text-text-secondary mb-4">
              Showing{' '}
              <span className="font-semibold text-text-primary">
                {doctors.length}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-text-primary">
                {totalItems}
              </span>{' '}
              doctors
            </p>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-muted flex items-center justify-center mx-auto mb-4">
                <Search size={28} className="text-text-muted" />
              </div>
              <h3 className="font-display font-bold text-text-primary mb-2">
                No doctors found
              </h3>
              <p className="text-text-secondary text-sm mb-4">
                Try adjusting your search terms or filters
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-primary">
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {doctors.map((doctor) => (
                <div
                  key={doctor._id}
                  className="card-hover p-5 md:p-6"
                  onClick={() =>
                    navigate(`/patient/doctors/${doctor._id}`, {
                      state: { speciality: doctor.speciality },
                    })
                  }
                >
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="flex-shrink-0">
                      <img
                        src={getImageUrl(doctor.profilePicture)}
                        alt={doctor.name}
                        className="w-20 h-20 rounded-2xl object-cover border border-surface-border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultAvatar;
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                        <h3 className="font-display font-bold text-text-primary text-lg">
                          Dr. {doctor.name}
                        </h3>
                        {doctor.averageRating !== undefined && (
                          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-1">
                            <Star
                              size={13}
                              className="fill-amber-400 text-amber-400"
                            />
                            <span className="text-sm font-bold text-amber-700">
                              {doctor.averageRating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        {doctor.speciality && (
                          <span className="badge-primary">
                            {doctor.speciality}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                          <Clock size={14} />
                          <span>
                            {doctor.totalExperience || 0} yrs experience
                          </span>
                        </div>
                        {doctor.gender && (
                          <span className="text-sm text-text-muted">
                            {doctor.gender}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mb-4">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              className={
                                doctor.averageRating !== undefined &&
                                doctor.averageRating >= star - 0.5
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-surface-border text-surface-border'
                              }
                            />
                          ))}
                        </div>
                        {doctor.averageRating === undefined && (
                          <span className="text-xs text-text-muted">
                            No ratings yet
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patient/doctors/${doctor._id}`, {
                            state: { speciality: doctor.speciality },
                          });
                        }}
                        className="btn-primary text-sm"
                      >
                        View Profile & Book
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mt-8"
          />
        </div>
      </div>
    </div>
  );
};

export default FindDoctor;
