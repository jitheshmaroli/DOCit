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
  age?: string;
  gender?: string;
  isVerified: boolean;
  isBlocked?: boolean;
  profilePicture?: string;
  refreshToken?: string;
  googleId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
