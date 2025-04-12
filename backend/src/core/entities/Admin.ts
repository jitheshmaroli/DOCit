export interface Admin {
  _id?: string;
  email: string;
  password?: string;
  name?: string;
  phone?: string;
  refreshToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
