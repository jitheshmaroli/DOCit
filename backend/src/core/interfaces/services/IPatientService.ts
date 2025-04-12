import { Patient } from '../../entities/Patient';

export interface IPatientService {
  signupPatient(patient: Patient): Promise<Patient>;
  loginPatient(
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string }>;
  googleSignInPatient(
    googleId: string,
    email: string,
    name: string
  ): Promise<{ accessToken: string; refreshToken: string }>;
}
