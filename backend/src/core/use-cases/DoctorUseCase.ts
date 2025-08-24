import { IDoctorUseCase } from '../interfaces/use-cases/IDoctorUseCase';
import { Doctor } from '../entities/Doctor';
import { IDoctorRepository } from '../interfaces/repositories/IDoctorRepository';
import { ISpecialityRepository } from '../interfaces/repositories/ISpecialityRepository';
import { QueryParams } from '../../types/authTypes';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { DoctorDTO, PaginatedDoctorResponseDTO } from '../interfaces/DoctorDTOs';
import { DoctorMapper } from '../interfaces/mappers/DoctorMapper';

export class DoctorUseCase implements IDoctorUseCase {
  constructor(
    private _doctorRepository: IDoctorRepository,
    private _specialityRepository: ISpecialityRepository
  ) {}

  async createDoctor(dto: Partial<DoctorDTO>): Promise<DoctorDTO> {
    if (!dto.email || !dto.name || !dto.speciality || !dto.password) {
      throw new ValidationError('Email, name, speciality, and password are required');
    }

    const existingDoctor = await this._doctorRepository.findByEmail(dto.email);
    if (existingDoctor) {
      throw new ValidationError('Doctor with this email already exists');
    }

    const speciality = await this._specialityRepository.findById(dto.speciality);
    if (!speciality) {
      throw new NotFoundError('Speciality not found');
    }

    const newDoctor: Doctor = {
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
    if (!doctorId) {
      throw new ValidationError('Doctor ID is required');
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
    if (!doctorId) {
      throw new ValidationError('Doctor ID is required');
    }

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    await this._doctorRepository.delete(doctorId);
  }

  async blockDoctor(doctorId: string, isBlocked: boolean): Promise<DoctorDTO> {
    if (!doctorId) {
      throw new ValidationError('Doctor ID is required');
    }

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
    if (!doctorId) {
      throw new ValidationError('Doctor ID is required');
    }

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
    const { data, totalItems } = await this._doctorRepository.findAllWithQuery(params);
    return DoctorMapper.toPaginatedResponseDTO(data, totalItems, params);
  }

  async getDoctor(doctorId: string): Promise<DoctorDTO | null> {
    if (!doctorId) {
      throw new ValidationError('Doctor ID is required');
    }

    const doctor = await this._doctorRepository.getDoctorDetails(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }
    return DoctorMapper.toDTO(doctor);
  }

  async getVerifiedDoctors(params: QueryParams): Promise<PaginatedDoctorResponseDTO> {
    const { data, totalItems } = await this._doctorRepository.findVerified(params);
    return DoctorMapper.toPaginatedResponseDTO(data, totalItems, params);
  }
}
