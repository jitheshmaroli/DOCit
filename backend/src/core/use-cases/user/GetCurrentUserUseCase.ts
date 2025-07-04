import { ValidationError } from '../../../utils/errors';
import { Admin } from '../../entities/Admin';
import { Doctor } from '../../entities/Doctor';
import { Patient } from '../../entities/Patient';
import { IAdminRepository } from '../../interfaces/repositories/IAdminRepository';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { IPatientRepository } from '../../interfaces/repositories/IPatientRepository';

export class GetCurrentUserUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private doctorRepository: IDoctorRepository,
    private adminRepository: IAdminRepository
  ) {}

  async execute(userId: string, role: 'patient' | 'doctor' | 'admin'): Promise<Patient | Doctor | Admin | null> {
    switch (role) {
      case 'patient':
        return this.patientRepository.findById(userId);
      case 'doctor':
        return this.doctorRepository.getDoctorDetails(userId);
      case 'admin':
        return this.adminRepository.getAdminDetails(userId);
      default:
        throw new ValidationError('Invalid user role');
    }
  }
}
