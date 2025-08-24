export interface DoctorDTO {
  _id?: string;
  email: string;
  name?: string;
  password?: string;
  phone?: string;
  qualifications?: string[];
  licenseNumber?: string;
  location?: string;
  speciality?: string;
  totalExperience?: number;
  lastSeen?: string;
  experiences?: Array<{
    hospitalName: string;
    department: string;
    years: number;
  }>;
  allowFreeBooking?: boolean;
  gender?: 'Male' | 'Female' | 'Other';
  isVerified?: boolean;
  isBlocked?: boolean;
  profilePicture?: string;
  profilePicturePublicId?: string;
  licenseProof?: string;
  licenseProofPublicId?: string;
  averageRating?: number;
  googleId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedDoctorResponseDTO {
  data: DoctorDTO[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}
