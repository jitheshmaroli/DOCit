import { PatientSubscription } from './PatientSubscription';

export interface Patient {
  _id?: string;
  email: string;
  password?: string | null;
  name?: string;
  phone?: string;
  age?: string;
  isSubscribed?: boolean;
  isBlocked?: boolean;
  address?: string;
  pincode?: string;
  profilePicture?: string;
  profilePicturePublicId?: string;
  gender?: 'Male' | 'Female' | 'Other';
  socialLogins?: Record<string, string>;
  lastSeen?: Date;
  isOnline?: boolean;
  isOtpVerified?: boolean;
  subscribedPlans?: PatientSubscription[];
  hasPassword?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
