export interface AddSpecialityRequestDTO {
  name: string;
}

export interface UpdateSpecialityRequestDTO {
  name: string;
}

export interface SpecialityResponseDTO {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSpecialityResponseDTO {
  data: SpecialityResponseDTO[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}
