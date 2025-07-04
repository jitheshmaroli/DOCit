import { IPatientRepository } from '../../../interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../../../interfaces/repositories/IDoctorRepository';
import { IAdminRepository } from '../../../interfaces/repositories/IAdminRepository';

export class LogoutUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private doctorRepository: IDoctorRepository,
    private adminRepository: IAdminRepository
  ) {}

  async execute(userId: string, role: 'patient' | 'doctor' | 'admin'): Promise<void> {
    if (role === 'patient') {
      await this.patientRepository.update(userId, { refreshToken: '' });
    } else if (role === 'doctor') {
      await this.doctorRepository.update(userId, { refreshToken: '' });
    } else {
      await this.adminRepository.update(userId, { refreshToken: '' });
    }
  }
}
