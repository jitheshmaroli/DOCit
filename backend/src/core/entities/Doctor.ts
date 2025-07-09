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
  experience?: number;
  allowFreeBooking: boolean;
  gender?: string;
  isVerified: boolean;
  isBlocked?: boolean;
  profilePicture?: string;
  profilePicturePublicId?: string;
  refreshToken?: string;
  googleId?: string;
  lastSeen?: Date;
  averageRating?: number;
  reviewIds?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
