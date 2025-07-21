import { IDoctorUseCase } from '../interfaces/use-cases/IDoctorUseCase';
import { Doctor } from '../entities/Doctor';
import { IDoctorRepository } from '../interfaces/repositories/IDoctorRepository';
import { ISpecialityRepository } from '../interfaces/repositories/ISpecialityRepository';
import { QueryParams } from '../../types/authTypes';
import { NotFoundError, ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';

export class DoctorUseCase implements IDoctorUseCase {
  constructor(
    private doctorRepository: IDoctorRepository,
    private specialityRepository: ISpecialityRepository
  ) {}

  async createDoctor(doctor: Partial<Doctor>): Promise<Doctor> {
    if (!doctor.email || !doctor.name || !doctor.speciality || !doctor.password) {
      logger.error('Missing required fields for creating doctor');
      throw new ValidationError('Email, name, speciality, and password are required');
    }

    const existingDoctor = await this.doctorRepository.findByEmail(doctor.email);
    if (existingDoctor) {
      logger.error(`Doctor with email ${doctor.email} already exists`);
      throw new ValidationError('Doctor with this email already exists');
    }

    const speciality = await this.specialityRepository.findById(doctor.speciality);
    if (!speciality) {
      logger.error(`Speciality not found: ${doctor.speciality}`);
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
      return await this.doctorRepository.create(newDoctor);
    } catch (error) {
      logger.error(`Error creating doctor: ${(error as Error).message}`);
      throw new Error('Failed to create doctor');
    }
  }

  async updateDoctor(doctorId: string, updates: Partial<Doctor>): Promise<Doctor> {
    if (!doctorId) {
      logger.error('Doctor ID is required for updating doctor');
      throw new ValidationError('Doctor ID is required');
    }

    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) {
      logger.error(`Doctor not found: ${doctorId}`);
      throw new NotFoundError('Doctor not found');
    }

    if (updates.email && updates.email !== doctor.email) {
      const existingDoctor = await this.doctorRepository.findByEmail(updates.email);
      if (existingDoctor) {
        logger.error(`Email ${updates.email} is already in use`);
        throw new ValidationError('Email is already in use');
      }
    }

    if (updates.speciality) {
      const speciality = await this.specialityRepository.findById(updates.speciality);
      if (!speciality) {
        logger.error(`Speciality not found: ${updates.speciality}`);
        throw new NotFoundError('Speciality not found');
      }
    }

    try {
      const updatedDoctor = await this.doctorRepository.update(doctorId, {
        ...updates,
        updatedAt: new Date(),
      });
      if (!updatedDoctor) {
        logger.error(`Failed to update doctor ${doctorId}`);
        throw new NotFoundError('Failed to update doctor');
      }
      return updatedDoctor;
    } catch (error) {
      logger.error(`Error updating doctor ${doctorId}: ${(error as Error).message}`);
      throw new Error('Failed to update doctor');
    }
  }

  async deleteDoctor(doctorId: string): Promise<void> {
    if (!doctorId) {
      logger.error('Doctor ID is required for deletion');
      throw new ValidationError('Doctor ID is required');
    }

    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) {
      logger.error(`Doctor not found: ${doctorId}`);
      throw new NotFoundError('Doctor not found');
    }

    await this.doctorRepository.delete(doctorId);
  }

  async blockDoctor(doctorId: string, isBlocked: boolean): Promise<Doctor> {
    if (!doctorId) {
      logger.error('Doctor ID is required for blocking/unblocking');
      throw new ValidationError('Doctor ID is required');
    }

    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) {
      logger.error(`Doctor not found: ${doctorId}`);
      throw new NotFoundError('Doctor not found');
    }

    if (doctor.isBlocked === isBlocked) {
      logger.warn(`Doctor ${doctorId} is already ${isBlocked ? 'blocked' : 'unblocked'}`);
      return doctor;
    }

    try {
      const updatedDoctor = await this.doctorRepository.update(doctorId, {
        isBlocked,
        updatedAt: new Date(),
      });
      if (!updatedDoctor) {
        logger.error(`Failed to ${isBlocked ? 'block' : 'unblock'} doctor ${doctorId}`);
        throw new NotFoundError(`Failed to ${isBlocked ? 'block' : 'unblock'} doctor`);
      }
      return updatedDoctor;
    } catch (error) {
      logger.error(`Error ${isBlocked ? 'blocking' : 'unblocking'} doctor ${doctorId}: ${(error as Error).message}`);
      throw new Error(`Failed to ${isBlocked ? 'block' : 'unblock'} doctor`);
    }
  }

  async verifyDoctor(doctorId: string): Promise<Doctor> {
    if (!doctorId) {
      logger.error('Doctor ID is required for verification');
      throw new ValidationError('Doctor ID is required');
    }

    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) {
      logger.error(`Doctor not found: ${doctorId}`);
      throw new NotFoundError('Doctor not found');
    }

    if (doctor.isVerified) {
      logger.warn(`Doctor ${doctorId} is already verified`);
      return doctor;
    }

    try {
      const updatedDoctor = await this.doctorRepository.update(doctorId, {
        isVerified: true,
        updatedAt: new Date(),
      });
      if (!updatedDoctor) {
        logger.error(`Failed to verify doctor ${doctorId}`);
        throw new NotFoundError('Failed to verify doctor');
      }
      return updatedDoctor;
    } catch (error) {
      logger.error(`Error verifying doctor ${doctorId}: ${(error as Error).message}`);
      throw new Error('Failed to verify doctor');
    }
  }

  async listDoctors(params: QueryParams): Promise<{ data: Doctor[]; totalItems: number }> {
    return await this.doctorRepository.findAllWithQuery(params);
  }

  async getDoctor(doctorId: string): Promise<Doctor | null> {
    if (!doctorId) {
      logger.error('Doctor ID is required for fetching doctor');
      throw new ValidationError('Doctor ID is required');
    }

    const doctor = await this.doctorRepository.getDoctorDetails(doctorId);
    if (!doctor) {
      logger.error(`Doctor not found: ${doctorId}`);
      throw new NotFoundError('Doctor not found');
    }
    return doctor;
  }

  async getVerifiedDoctors(params: QueryParams): Promise<{ data: Doctor[]; totalItems: number }> {
    return await this.doctorRepository.findVerified(params);
  }
}
