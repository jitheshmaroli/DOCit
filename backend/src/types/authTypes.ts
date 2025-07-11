export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  speciality?: string;
  isBlocked?: boolean;
  isVerified?: boolean;
  isSubscribed?: boolean;
  availabilityStart?: string;
  availabilityEnd?: string;
  doctorId?: string;
  patientId?: string;
  experience?: string;
  gender?: string;
  minRating?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}
