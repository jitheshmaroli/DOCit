import { UserRole } from '../../types';
import { ValidationError } from '../../utils/errors';
import { Admin } from '../entities/Admin';
import { Doctor } from '../entities/Doctor';
import { Patient } from '../entities/Patient';
import { IAdminRepository } from '../interfaces/repositories/IAdminRepository';
import { IDoctorRepository } from '../interfaces/repositories/IDoctorRepository';
import { IPatientRepository } from '../interfaces/repositories/IPatientRepository';
import { IUserUseCase } from '../interfaces/use-cases/IUserUseCase';

export class UserUseCase implements IUserUseCase {
  constructor(
    private _patientRepository: IPatientRepository,
    private _doctorRepository: IDoctorRepository,
    private _adminRepository: IAdminRepository
  ) {}

  async getCurrentUser(userId: string, role: UserRole): Promise<Patient | Doctor | Admin | null> {
    switch (role) {
      case UserRole.Patient:
        return this._patientRepository.findById(userId);
      case UserRole.Doctor:
        return this._doctorRepository.findById(userId); // Changed from getDoctorDetails to findById
      case UserRole.Admin:
        return this._adminRepository.getAdminDetails(userId);
      default:
        throw new ValidationError('Invalid user role');
    }
  }

  async getUser(userId: string): Promise<Patient | Doctor | Admin | null> {
    const patient = await this._patientRepository.findById(userId);
    if (patient) return patient;

    const doctor = await this._doctorRepository.findById(userId); // Use findById for consistency
    if (doctor) return doctor;

    const admin = await this._adminRepository.getAdminDetails(userId);
    if (admin) return admin;

    return null;
  }
}
