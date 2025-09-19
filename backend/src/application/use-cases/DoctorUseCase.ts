import { IDoctorUseCase } from '../../core/interfaces/use-cases/IDoctorUseCase';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { ISpecialityRepository } from '../../core/interfaces/repositories/ISpecialityRepository';
import { QueryParams } from '../../types/authTypes';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { DoctorDTO, PaginatedDoctorResponseDTO } from '../dtos/DoctorDTOs';
import { DoctorMapper } from '../mappers/DoctorMapper';
import { IValidatorService } from '../../core/interfaces/services/IValidatorService';

export class DoctorUseCase implements IDoctorUseCase {
  constructor(
    private _doctorRepository: IDoctorRepository,
    private _specialityRepository: ISpecialityRepository,
    private _validatorService: IValidatorService
  ) {}

  async createDoctor(dto: Partial<DoctorDTO>): Promise<DoctorDTO> {
    // Validate required fields
    this._validatorService.validateRequiredFields({
      email: dto.email,
      name: dto.name,
      speciality: dto.speciality,
      password: dto.password,
    });

    // Validate email, name, password, and speciality
    this._validatorService.validateEmailFormat(dto.email!);
    this._validatorService.validateName(dto.name!);
    this._validatorService.validatePassword(dto.password!);
    this._validatorService.validateIdFormat(dto.speciality!);

    const existingDoctor = await this._doctorRepository.findByEmail(dto.email!);
    if (existingDoctor) {
      throw new ValidationError('Doctor with this email already exists');
    }

    const speciality = await this._specialityRepository.findById(dto.speciality!);
    if (!speciality) {
      throw new NotFoundError('Speciality not found');
    }

    const newDoctor = {
      ...DoctorMapper.toEntity(dto as DoctorDTO),
      isVerified: false,
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const createdDoctor = await this._doctorRepository.create(newDoctor);
      return DoctorMapper.toDTO(createdDoctor);
    } catch {
      throw new Error('Failed to create doctor');
    }
  }

  async updateDoctor(doctorId: string, updates: Partial<DoctorDTO>): Promise<DoctorDTO> {
    // Validate doctorId
    this._validatorService.validateRequiredFields({ doctorId });
    this._validatorService.validateIdFormat(doctorId);

    // Validate optional fields if provided
    if (updates.email) {
      this._validatorService.validateEmailFormat(updates.email);
    }
    if (updates.name) {
      this._validatorService.validateName(updates.name);
    }
    if (updates.password) {
      this._validatorService.validatePassword(updates.password);
    }
    if (updates.speciality) {
      this._validatorService.validateIdFormat(updates.speciality);
    }

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    if (updates.email && updates.email !== doctor.email) {
      const existingDoctor = await this._doctorRepository.findByEmail(updates.email);
      if (existingDoctor) {
        throw new ValidationError('Email is already in use');
      }
    }

    if (updates.speciality) {
      const speciality = await this._specialityRepository.findById(updates.speciality);
      if (!speciality) {
        throw new NotFoundError('Speciality not found');
      }
    }

    try {
      const updatedDoctor = await this._doctorRepository.update(doctorId, {
        ...updates,
        updatedAt: new Date(),
      });
      if (!updatedDoctor) {
        throw new NotFoundError('Failed to update doctor');
      }
      return DoctorMapper.toDTO(updatedDoctor);
    } catch {
      throw new Error('Failed to update doctor');
    }
  }

  async deleteDoctor(doctorId: string): Promise<void> {
    // Validate doctorId
    this._validatorService.validateRequiredFields({ doctorId });
    this._validatorService.validateIdFormat(doctorId);

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    await this._doctorRepository.delete(doctorId);
  }

  async blockDoctor(doctorId: string, isBlocked: boolean): Promise<DoctorDTO> {
    // Validate doctorId and isBlocked
    this._validatorService.validateRequiredFields({ doctorId, isBlocked });
    this._validatorService.validateIdFormat(doctorId);
    this._validatorService.validateBoolean(isBlocked);

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    if (doctor.isBlocked === isBlocked) {
      return DoctorMapper.toDTO(doctor);
    }

    try {
      const updatedDoctor = await this._doctorRepository.update(doctorId, {
        isBlocked,
        updatedAt: new Date(),
      });
      if (!updatedDoctor) {
        throw new NotFoundError(`Failed to ${isBlocked ? 'block' : 'unblock'} doctor`);
      }
      return DoctorMapper.toDTO(updatedDoctor);
    } catch {
      throw new Error(`Failed to ${isBlocked ? 'block' : 'unblock'} doctor`);
    }
  }

  async verifyDoctor(doctorId: string): Promise<DoctorDTO> {
    // Validate doctorId
    this._validatorService.validateRequiredFields({ doctorId });
    this._validatorService.validateIdFormat(doctorId);

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    if (doctor.isVerified) {
      return DoctorMapper.toDTO(doctor);
    }

    try {
      const updatedDoctor = await this._doctorRepository.update(doctorId, {
        isVerified: true,
        updatedAt: new Date(),
      });
      if (!updatedDoctor) {
        throw new NotFoundError('Failed to verify doctor');
      }
      return DoctorMapper.toDTO(updatedDoctor);
    } catch {
      throw new Error('Failed to verify doctor');
    }
  }

  async listDoctors(params: QueryParams): Promise<PaginatedDoctorResponseDTO> {
    // No specific validation for QueryParams, as it's typically flexible
    const { data, totalItems } = await this._doctorRepository.findAllWithQuery(params);
    const doctorDTOs = data.map(DoctorMapper.toDTO);
    return DoctorMapper.toPaginatedResponseDTO(doctorDTOs, totalItems, params);
  }

  async getDoctor(doctorId: string): Promise<DoctorDTO | null> {
    // Validate doctorId
    this._validatorService.validateRequiredFields({ doctorId });
    this._validatorService.validateIdFormat(doctorId);

    const doctor = await this._doctorRepository.getDoctorDetails(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }
    return DoctorMapper.toDTO(doctor);
  }

  async getVerifiedDoctors(params: QueryParams): Promise<PaginatedDoctorResponseDTO> {
    const { data, totalItems } = await this._doctorRepository.findVerified(params);
    const doctorDTOs = data.map(DoctorMapper.toDTO);
    return DoctorMapper.toPaginatedResponseDTO(doctorDTOs, totalItems, params);
  }
}
