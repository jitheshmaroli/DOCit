import { IPatientUseCase } from '../interfaces/use-cases/IPatientUseCase';
import { Patient } from '../entities/Patient';
import { PatientSubscription } from '../entities/PatientSubscription';
import { IPatientRepository } from '../interfaces/repositories/IPatientRepository';
import { IPatientSubscriptionRepository } from '../interfaces/repositories/IPatientSubscriptionRepository';
import { QueryParams } from '../../types/authTypes';
import { NotFoundError, ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';

interface PopulatedPlan {
  _id: string;
  name: string;
  description: string;
  doctorId: string;
  price: number;
  validityDays: number;
  appointmentCount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

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
    const subscription = await this._patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, doctorId);
    if (!subscription || !subscription.planId) {
      return null;
    }
    logger.info('subscription:', subscription);
    return subscription;
  }

  async getSubscribedPatients(doctorId: string): Promise<Patient[] | null> {
    if (!doctorId) {
      throw new ValidationError('Doctor ID is required');
    }

    // Fetch active subscriptions with populated planId
    const activeSubscriptions = await this._patientSubscriptionRepository.findActiveSubscriptions();
    const patientIds: string[] = [];
    const patientSubscriptions: { [patientId: string]: PatientSubscription[] } = {};

    // Filter subscriptions by doctorId and collect patient IDs
    for (const sub of activeSubscriptions) {
      const plan = sub.planId as unknown as PopulatedPlan; // Type assertion to minimal interface
      if (plan && plan.doctorId === doctorId) {
        if (!patientSubscriptions[sub.patientId]) {
          patientIds.push(sub.patientId);
          patientSubscriptions[sub.patientId] = [];
        }
        patientSubscriptions[sub.patientId].push({
          ...sub,
          planId: sub.planId as string, // Preserve original planId string
          planDetails: {
            _id: plan._id,
            name: plan.name || 'Unknown Plan',
            description: plan.description || '',
            doctorId: plan.doctorId,
            price: plan.price || 0,
            validityDays: plan.validityDays || 0,
            appointmentCount: plan.appointmentCount || 0,
            status: plan.status || 'pending',
            createdAt: plan.createdAt || new Date().toISOString(),
            updatedAt: plan.updatedAt || new Date().toISOString(),
          },
        });
      }
    }

    // Fetch patient details
    const subscribedPatients: Patient[] = [];
    for (const patientId of patientIds) {
      const patient = await this._patientRepository.findById(patientId);
      if (patient) {
        subscribedPatients.push({
          ...patient,
          subscribedPlans: patientSubscriptions[patientId],
        });
      }
    }

    return subscribedPatients.length > 0 ? subscribedPatients : null;
  }
}
