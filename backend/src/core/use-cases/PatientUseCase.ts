import { IPatientUseCase } from '../interfaces/use-cases/IPatientUseCase';
import { Patient } from '../entities/Patient';
import { PatientSubscription } from '../entities/PatientSubscription';
import { IPatientRepository } from '../interfaces/repositories/IPatientRepository';
import { IPatientSubscriptionRepository } from '../interfaces/repositories/IPatientSubscriptionRepository';
import { QueryParams } from '../../types/authTypes';
import { NotFoundError, ValidationError } from '../../utils/errors';

export class PatientUseCase implements IPatientUseCase {
  constructor(
    private _patientRepository: IPatientRepository,
    private _patientSubscriptionRepository: IPatientSubscriptionRepository
  ) {}

  async createPatient(patient: Partial<Patient>): Promise<Patient> {
    if (!patient.email || !patient.name || !patient.password) {
      throw new ValidationError('Email, name, and password are required');
    }

    const existingPatient = await this._patientRepository.findByEmail(patient.email);
    if (existingPatient) {
      throw new ValidationError('Patient with this email already exists');
    }

    const newPatient: Patient = {
      ...patient,
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Patient;

    try {
      return await this._patientRepository.create(newPatient);
    } catch {
      throw new Error('Failed to create patient');
    }
  }

  async updatePatient(patientId: string, updates: Partial<Patient>): Promise<Patient | null> {
    if (!patientId) {
      throw new ValidationError('Patient ID is required');
    }

    const patient = await this._patientRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    if (updates.email && updates.email !== patient.email) {
      const existingPatient = await this._patientRepository.findByEmail(updates.email);
      if (existingPatient) {
        throw new ValidationError('Email is already in use');
      }
    }

    try {
      const updatedPatient = await this._patientRepository.update(patientId, {
        ...updates,
        updatedAt: new Date(),
      });
      if (!updatedPatient) {
        throw new NotFoundError('Failed to update patient');
      }
      return updatedPatient;
    } catch {
      throw new Error('Failed to update patient');
    }
  }

  async deletePatient(patientId: string): Promise<void> {
    if (!patientId) {
      throw new ValidationError('Patient ID is required');
    }

    const patient = await this._patientRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    await this._patientRepository.delete(patientId);
  }

  async blockPatient(patientId: string, isBlocked: boolean): Promise<Patient | null> {
    if (!patientId) {
      throw new ValidationError('Patient ID is required');
    }

    const patient = await this._patientRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    if (patient.isBlocked === isBlocked) {
      return patient;
    }

    try {
      const updatedPatient = await this._patientRepository.update(patientId, {
        isBlocked,
        updatedAt: new Date(),
      });
      if (!updatedPatient) {
        throw new NotFoundError(`Failed to ${isBlocked ? 'block' : 'unblock'} patient`);
      }
      return updatedPatient;
    } catch {
      throw new Error(`Failed to ${isBlocked ? 'block' : 'unblock'} patient`);
    }
  }

  async listPatients(params: QueryParams): Promise<{ data: Patient[]; totalItems: number }> {
    return await this._patientRepository.findAllWithQuery(params);
  }

  async getPatientSubscriptions(patientId: string): Promise<PatientSubscription[]> {
    if (!patientId) {
      throw new ValidationError('Patient ID is required');
    }

    return await this._patientSubscriptionRepository.findByPatient(patientId);
  }

  async getPatientActiveSubscription(patientId: string, doctorId: string): Promise<PatientSubscription | null> {
    if (!patientId || !doctorId) {
      throw new ValidationError('Patient ID and doctor ID are required');
    }

    return await this._patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, doctorId);
  }
}
