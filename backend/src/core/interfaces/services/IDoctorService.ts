import { Doctor } from '../../entities/Doctor';

export interface IDoctorService {
  signupDoctor(doctor: Doctor): Promise<Doctor>;
  loginDoctor(
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string }>;
}
