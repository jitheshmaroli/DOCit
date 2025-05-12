import { Request } from 'express';

export enum UserRole {
  Patient = 'patient',
  Doctor = 'doctor',
  Admin = 'admin',
}

export interface CustomRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}
