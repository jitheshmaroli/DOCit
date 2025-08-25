export interface AdminDTO {
  _id?: string;
  email: string;
  password?: string;
  name?: string;
  role?: 'admin';
  gender?: 'Male' | 'Female' | 'Other';
  createdAt?: Date;
  updatedAt?: Date;
}
