import { IPatientUseCase } from '../interfaces/use-cases/IPatientUseCase';
import { Patient } from '../entities/Patient';
import { PatientSubscription } from '../entities/PatientSubscription';
import { IPatientRepository } from '../interfaces/repositories/IPatientRepository';
import { IPatientSubscriptionRepository } from '../interfaces/repositories/IPatientSubscriptionRepository';
import { QueryParams } from '../../types/authTypes';
import { NotFoundError, ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';

export class PatientUseCase implements IPatientUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository
  ) {}

  async createPatient(patient: Partial<Patient>): Promise<Patient> {
    if (!patient.email || !patient.name || !patient.password) {
      logger.error('Missing required fields for creating patient');
      throw new ValidationError('Email, name, and password are required');
    }

    const existingPatient = await this.patientRepository.findByEmail(patient.email);
    if (existingPatient) {
      logger.error(`Patient with email ${patient.email} already exists`);
      throw new ValidationError('Patient with this email already exists');
    }

    const newPatient: Patient = {
      ...patient,
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Patient;

    try {
      return await this.patientRepository.create(newPatient);
    } catch (error) {
      logger.error(`Error creating patient: ${(error as Error).message}`);
      throw new Error('Failed to create patient');
    }
  }

  async updatePatient(patientId: string, updates: Partial<Patient>): Promise<Patient | null> {
    if (!patientId) {
      logger.error('Patient ID is required for updating patient');
      throw new ValidationError('Patient ID is required');
    }

    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      logger.error(`Patient not found: ${patientId}`);
      throw new NotFoundError('Patient not found');
    }

    if (updates.email && updates.email !== patient.email) {
      const existingPatient = await this.patientRepository.findByEmail(updates.email);
      if (existingPatient) {
        logger.error(`Email ${updates.email} is already in use`);
        throw new ValidationError('Email is already in use');
      }
    }

    try {
      const updatedPatient = await this.patientRepository.update(patientId, {
        ...updates,
        updatedAt: new Date(),
      });
      if (!updatedPatient) {
        logger.error(`Failed to update patient ${patientId}`);
        throw new NotFoundError('Failed to update patient');
      }
      return updatedPatient;
    } catch (error) {
      logger.error(`Error updating patient ${patientId}: ${(error as Error).message}`);
      throw new Error('Failed to update patient');
    }
  }

  async deletePatient(patientId: string): Promise<void> {
    if (!patientId) {
      logger.error('Patient ID is required for deletion');
      throw new ValidationError('Patient ID is required');
    }

    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      logger.error(`Patient not found: ${patientId}`);
      throw new NotFoundError('Patient not found');
    }

    await this.patientRepository.delete(patientId);
  }

  async blockPatient(patientId: string, isBlocked: boolean): Promise<Patient | null> {
    if (!patientId) {
      logger.error('Patient ID is required for blocking/unblocking');
      throw new ValidationError('Patient ID is required');
    }

    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      logger.error(`Patient not found: ${patientId}`);
      throw new NotFoundError('Patient not found');
    }

    if (patient.isBlocked === isBlocked) {
      logger.warn(`Patient ${patientId} is already ${isBlocked ? 'blocked' : 'unblocked'}`);
      return patient;
    }

    try {
      const updatedPatient = await this.patientRepository.update(patientId, {
        isBlocked,
        updatedAt: new Date(),
      });
      if (!updatedPatient) {
        logger.error(`Failed to ${isBlocked ? 'block' : 'unblock'} patient ${patientId}`);
        throw new NotFoundError(`Failed to ${isBlocked ? 'block' : 'unblock'} patient`);
      }
      return updatedPatient;
    } catch (error) {
      logger.error(`Error ${isBlocked ? 'blocking' : 'unblocking'} patient ${patientId}: ${(error as Error).message}`);
      throw new Error(`Failed to ${isBlocked ? 'block' : 'unblock'} patient`);
    }
  }

  async listPatients(params: QueryParams): Promise<{ data: Patient[]; totalItems: number }> {
    return await this.patientRepository.findAllWithQuery(params);
  }

  async getPatientSubscriptions(patientId: string): Promise<PatientSubscription[]> {
    if (!patientId) {
      logger.error('Patient ID is required for fetching subscriptions');
      throw new ValidationError('Patient ID is required');
    }

    return await this.patientSubscriptionRepository.findByPatient(patientId);
  }

  async getPatientActiveSubscription(patientId: string, doctorId: string): Promise<PatientSubscription | null> {
    if (!patientId || !doctorId) {
      logger.error('Patient ID and doctor ID are required for fetching active subscription');
      throw new ValidationError('Patient ID and doctor ID are required');
    }

    return await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, doctorId);
  }
}
