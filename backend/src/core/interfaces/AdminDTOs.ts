export interface AdminDTO {
  _id?: string;
  email: string;
  password?: string;
  name?: string;
  role?: 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}
