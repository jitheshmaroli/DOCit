import { ConflictError } from '../../../../utils/errors';
import { Doctor } from '../../../entities/Doctor';
import { IDoctorRepository } from '../../../interfaces/repositories/IDoctorRepository';
import { IOTPService } from '../../../interfaces/services/IOTPService';

export class SignupDoctorUseCase {
  constructor(
    private doctorRepository: IDoctorRepository,
    private otpService: IOTPService
  ) {}

  async execute(doctor: Doctor): Promise<Doctor> {
    const existingDoctor = await this.doctorRepository.findByEmail(doctor.email);
    if (existingDoctor) {
      if (existingDoctor.googleId) {
        await this.otpService.sendOTP(doctor.email);
        return existingDoctor;
      }
      throw new ConflictError('Email already registered');
    }
    await this.otpService.deleteOTP(doctor.email);
    await this.otpService.sendOTP(doctor.email);
    return doctor;
  }
}
