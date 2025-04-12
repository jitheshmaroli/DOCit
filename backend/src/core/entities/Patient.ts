export interface Patient {
  _id?: string;
  email: string;
  password?: string;
  name?: string;
  phone?: string;
  bloodGroup?: string;
  age?: string;
  isSubscribed?: boolean;
  isBlocked?: boolean;
  address?: string;
  pincode?: string;
  profilePicture?: string;
  refreshToken?: string;
  gender?: 'Male' | 'Female' | 'Other';
  googleId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
