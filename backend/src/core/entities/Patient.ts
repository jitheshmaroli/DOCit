export interface Patient {
  _id?: string;
  email: string;
  password?: string;
  name?: string;
  phone?: string;
  age?: string;
  isSubscribed?: boolean;
  isBlocked?: boolean;
  address?: string;
  pincode?: string;
  profilePicture?: string;
  profilePicturePublicId?: string;
  refreshToken?: string;
  gender?: 'Male' | 'Female' | 'Other';
  googleId?: string;
  lastSeen?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
