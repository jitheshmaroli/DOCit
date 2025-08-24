export interface Admin {
  _id?: string;
  email: string;
  password?: string;
  name?: string;
  phone?: string;
  refreshToken?: string;
  isBlocked?: boolean;
  gender?: 'Male' | 'Female' | 'Other';
  lastSeen?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
