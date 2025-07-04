import { Admin } from '../../entities/Admin';
import { Doctor } from '../../entities/Doctor';
import { Patient } from '../../entities/Patient';
import { IAdminRepository } from '../../interfaces/repositories/IAdminRepository';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { IPatientRepository } from '../../interfaces/repositories/IPatientRepository';

export class GetUserUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private doctorRepository: IDoctorRepository,
    private adminRepository: IAdminRepository
  ) {}

  async execute(userId: string): Promise<Patient | Doctor | Admin | null> {
    const patient = await this.patientRepository.findById(userId);
    if (patient) return patient;

    const doctor = await this.doctorRepository.getDoctorDetails(userId);
    if (doctor) return doctor;

    const admin = await this.adminRepository.getAdminDetails(userId);
    if (admin) return admin;

    return null;
  }
}
