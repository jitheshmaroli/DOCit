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
  dateFrom?: string;
  dateTo?: string;
  doctorId?: string;
  patientId?: string;
  ageRange?: string;
  gender?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}
