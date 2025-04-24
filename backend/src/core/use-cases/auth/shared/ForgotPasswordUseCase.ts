import { IPatientRepository } from '../../../interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../../../interfaces/repositories/IDoctorRepository';
import { IAdminRepository } from '../../../interfaces/repositories/IAdminRepository';
import { IOTPService } from '../../../interfaces/services/IOTPService';
import { NotFoundError } from '../../../../utils/errors';

export class ForgotPasswordUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private doctorRepository: IDoctorRepository,
    private adminRepository: IAdminRepository,
    private otpService: IOTPService
  ) {}

  async execute(email: string): Promise<void> {
    const user =
      (await this.patientRepository.findByEmail(email)) ||
      (await this.doctorRepository.findByEmail(email)) ||
      (await this.adminRepository.findByEmail(email));
    if (!user) throw new NotFoundError('User not found');

    await this.otpService.deleteOTP(email);
    await this.otpService.sendOTP(email);
  }
}
