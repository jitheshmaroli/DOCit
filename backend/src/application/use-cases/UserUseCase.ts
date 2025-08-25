import { UserRole } from '../../types';
import { ValidationError } from '../../utils/errors';
import { Admin } from '../../core/entities/Admin';
import { Doctor } from '../../core/entities/Doctor';
import { Patient } from '../../core/entities/Patient';
import { UserMapper } from '../mappers/UserMapper';
import { IAdminRepository } from '../../core/interfaces/repositories/IAdminRepository';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { IPatientRepository } from '../../core/interfaces/repositories/IPatientRepository';
import { IUserUseCase } from '../../core/interfaces/use-cases/IUserUseCase';
import { GetUserResponseDTO } from '../dtos/UserDTOs';

export class UserUseCase implements IUserUseCase {
  constructor(
    private _patientRepository: IPatientRepository,
    private _doctorRepository: IDoctorRepository,
    private _adminRepository: IAdminRepository
  ) {}

  async getCurrentUser(userId: string, role: UserRole): Promise<GetUserResponseDTO | null> {
    let entity: Patient | Doctor | Admin | null;

    switch (role) {
      case UserRole.Patient:
        entity = await this._patientRepository.findById(userId);
        if (!entity) return null;
        return UserMapper.toGetUserResponseDTO(entity, UserRole.Patient);
      case UserRole.Doctor:
        entity = await this._doctorRepository.findById(userId);
        if (!entity) return null;
        return UserMapper.toGetUserResponseDTO(entity, UserRole.Doctor);
      case UserRole.Admin:
        entity = await this._adminRepository.getAdminDetails(userId);
        if (!entity) return null;
        return UserMapper.toGetUserResponseDTO(entity, UserRole.Admin);
      default:
        throw new ValidationError('Invalid user role');
    }
  }

  async getUser(userId: string): Promise<GetUserResponseDTO | null> {
    const patient = await this._patientRepository.findById(userId);
    if (patient) return UserMapper.toGetUserResponseDTO(patient, UserRole.Patient);

    const doctor = await this._doctorRepository.findById(userId);
    if (doctor) return UserMapper.toGetUserResponseDTO(doctor, UserRole.Doctor);

    const admin = await this._adminRepository.getAdminDetails(userId);
    if (admin) return UserMapper.toGetUserResponseDTO(admin, UserRole.Admin);

    return null;
  }
}
