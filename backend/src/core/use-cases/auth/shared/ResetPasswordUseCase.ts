import { IPatientRepository } from '../../../interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../../../interfaces/repositories/IDoctorRepository';
import { IAdminRepository } from '../../../interfaces/repositories/IAdminRepository';
import { IOTPService } from '../../../interfaces/services/IOTPService';
import bcrypt from 'bcryptjs';
import { AuthenticationError, ValidationError } from '../../../../utils/errors';

export class ResetPasswordUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private doctorRepository: IDoctorRepository,
    private adminRepository: IAdminRepository,
    private otpService: IOTPService
  ) {}

  async execute(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<void> {
    const isValid = await this.otpService.verifyOTP(email, otp);
    if (!isValid) throw new ValidationError('Invalid or expired OTP');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const patient = await this.patientRepository.findByEmail(email);
    if (patient) {
      await this.patientRepository.update(patient._id!, {
        password: hashedPassword,
      });
    } else {
      const doctor = await this.doctorRepository.findByEmail(email);
      if (doctor) {
        await this.doctorRepository.update(doctor._id!, {
          password: hashedPassword,
        });
      } else {
        const admin = await this.adminRepository.findByEmail(email);
        if (admin) {
          await this.adminRepository.update(admin._id!, {
            password: hashedPassword,
          });
        }
      }
    }

    await this.otpService.deleteOTP(email);
  }
}
