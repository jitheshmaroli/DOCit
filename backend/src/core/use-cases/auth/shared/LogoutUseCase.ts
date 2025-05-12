import { IPatientRepository } from '../../../interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../../../interfaces/repositories/IDoctorRepository';
import { IAdminRepository } from '../../../interfaces/repositories/IAdminRepository';

export class LogoutUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private doctorRepository: IDoctorRepository,
    private adminRepository: IAdminRepository
  ) {}

  async execute(id: string, role: 'patient' | 'doctor' | 'admin'): Promise<void> {
    if (role === 'patient') {
      await this.patientRepository.update(id, { refreshToken: '' });
    } else if (role === 'doctor') {
      await this.doctorRepository.update(id, { refreshToken: '' });
    } else {
      await this.adminRepository.update(id, { refreshToken: '' });
    }
  }
}
