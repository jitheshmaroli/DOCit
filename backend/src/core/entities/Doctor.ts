export interface Doctor {
  _id?: string;
  email: string;
  password?: string;
  name?: string;
  phone?: string;
  qualifications?: string[];
  licenseNumber?: string;
  location?: string;
  speciality?: string;
  totalExperience?: number;
  experiences?: Array<{
    hospitalName: string;
    department: string;
    years: number;
  }>;
  allowFreeBooking: boolean;
  gender?: string;
  isVerified: boolean;
  isBlocked?: boolean;
  profilePicture?: string;
  profilePicturePublicId?: string;
  refreshToken?: string;
  googleId?: string;
  lastSeen?: Date;
  isOnline?: boolean;
  isOtpVerified?: boolean;
  averageRating?: number;
  reviewIds?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Experience {
  hospitalName: string;
  department: string;
  years: number;
}
