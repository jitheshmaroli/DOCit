import { IDoctorUseCase } from '../interfaces/use-cases/IDoctorUseCase';
import { Doctor } from '../entities/Doctor';
import { IDoctorRepository } from '../interfaces/repositories/IDoctorRepository';
import { ISpecialityRepository } from '../interfaces/repositories/ISpecialityRepository';
import { QueryParams } from '../../types/authTypes';
import { NotFoundError, ValidationError } from '../../utils/errors';

export class DoctorUseCase implements IDoctorUseCase {
  constructor(
    private _doctorRepository: IDoctorRepository,
    private _specialityRepository: ISpecialityRepository
  ) {}

  async createDoctor(doctor: Partial<Doctor>): Promise<Doctor> {
    if (!doctor.email || !doctor.name || !doctor.speciality || !doctor.password) {
      throw new ValidationError('Email, name, speciality, and password are required');
    }

    const existingDoctor = await this._doctorRepository.findByEmail(doctor.email);
    if (existingDoctor) {
      throw new ValidationError('Doctor with this email already exists');
    }

    const speciality = await this._specialityRepository.findById(doctor.speciality);
    if (!speciality) {
      throw new NotFoundError('Speciality not found');
    }

    const newDoctor: Doctor = {
      ...doctor,
      isVerified: false,
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Doctor;

    try {
      return await this._doctorRepository.create(newDoctor);
    } catch {
      throw new Error('Failed to create doctor');
    }
  }

  async updateDoctor(doctorId: string, updates: Partial<Doctor>): Promise<Doctor> {
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
      return updatedDoctor;
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

  async blockDoctor(doctorId: string, isBlocked: boolean): Promise<Doctor> {
    if (!doctorId) {
      throw new ValidationError('Doctor ID is required');
    }

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    if (doctor.isBlocked === isBlocked) {
      return doctor;
    }

    try {
      const updatedDoctor = await this._doctorRepository.update(doctorId, {
        isBlocked,
        updatedAt: new Date(),
      });
      if (!updatedDoctor) {
        throw new NotFoundError(`Failed to ${isBlocked ? 'block' : 'unblock'} doctor`);
      }
      return updatedDoctor;
    } catch {
      throw new Error(`Failed to ${isBlocked ? 'block' : 'unblock'} doctor`);
    }
  }

  async verifyDoctor(doctorId: string): Promise<Doctor> {
    if (!doctorId) {
      throw new ValidationError('Doctor ID is required');
    }

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    if (doctor.isVerified) {
      return doctor;
    }

    try {
      const updatedDoctor = await this._doctorRepository.update(doctorId, {
        isVerified: true,
        updatedAt: new Date(),
      });
      if (!updatedDoctor) {
        throw new NotFoundError('Failed to verify doctor');
      }
      return updatedDoctor;
    } catch {
      throw new Error('Failed to verify doctor');
    }
  }

  async listDoctors(params: QueryParams): Promise<{ data: Doctor[]; totalItems: number }> {
    return await this._doctorRepository.findAllWithQuery(params);
  }

  async getDoctor(doctorId: string): Promise<Doctor | null> {
    if (!doctorId) {
      throw new ValidationError('Doctor ID is required');
    }

    const doctor = await this._doctorRepository.getDoctorDetails(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }
    return doctor;
  }

  async getVerifiedDoctors(params: QueryParams): Promise<{ data: Doctor[]; totalItems: number }> {
    return await this._doctorRepository.findVerified(params);
  }
}
