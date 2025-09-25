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
  allowFreeBooking?: boolean;
  gender?: 'Male' | 'Female' | 'Other';
  isVerified?: boolean;
  isBlocked?: boolean;
  profilePicture?: string;
  profilePicturePublicId?: string;
  licenseProof?: string;
  licenseProofPublicId?: string;
  // refreshToken?: string;
  // googleId?: string;
  socialLogins?: Record<string, string>;
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
