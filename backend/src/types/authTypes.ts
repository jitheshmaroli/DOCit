export interface QueryParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
    specialty?: string;
    isBlocked?: boolean;
    isVerified?: boolean; 
    isSubscribed?: boolean;
    dateFrom?: string; 
    dateTo?: string;
  }
  
  export interface PaginatedResponse<T> {
    data: T[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
  }