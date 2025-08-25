import { UserRole } from '../../types';
import { PatientSubscriptionDTO } from './PatientDTOs';

export interface GetUserResponseDTO {
  _id: string;
  email: string;
  name?: string;
  role: UserRole;
  phone?: string;
  age?: string;
  isSubscribed?: boolean;
  address?: string;
  pincode?: string;
  profilePicture?: string;
  gender?: 'Male' | 'Female' | 'Other';
  subscribedPlans?: PatientSubscriptionDTO[];
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
  isVerified?: boolean;
  profilePicturePublicId?: string;
  licenseProof?: string;
  licenseProofPublicId?: string;
  averageRating?: number;
  isBlocked?: boolean;
  lastSeen?: string;
  createdAt?: string;
  updatedAt?: string;
}
