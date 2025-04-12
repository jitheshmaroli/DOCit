import { Doctor } from '../../entities/Doctor';
import { Patient } from '../../entities/Patient';

export interface IAdminService {
  loginAdmin(
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string }>;
  listPatients(): Promise<Patient[]>;
  listDoctors(): Promise<Doctor[]>;
  listVerifiedDoctors(): Promise<Doctor[]>;
  verifyDoctor(doctorId: string): Promise<Doctor | null>;
}
