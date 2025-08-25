import { IPatientUseCase } from '../interfaces/use-cases/IPatientUseCase';
import { PatientSubscription } from '../entities/PatientSubscription';
import { IPatientRepository } from '../interfaces/repositories/IPatientRepository';
import { IPatientSubscriptionRepository } from '../interfaces/repositories/IPatientSubscriptionRepository';
import { QueryParams } from '../../types/authTypes';
import { NotFoundError, ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';
import { PatientDTO, PatientSubscriptionDTO, PaginatedPatientResponseDTO } from '../interfaces/PatientDTOs';
import { PatientMapper } from '../interfaces/mappers/PatientMapper';
import { PatientSubscriptionMapper } from '../interfaces/mappers/PatientSubscriptionMapper';

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

  async createPatient(dto: Partial<PatientDTO>): Promise<PatientDTO> {
    if (!dto.email || !dto.name || !dto.password) {
      throw new ValidationError('Email, name, and password are required');
    }

    const existingPatient = await this._patientRepository.findByEmail(dto.email);
    if (existingPatient) {
      throw new ValidationError('Patient with this email already exists');
    }

    const newPatient = {
      ...PatientMapper.toEntity(dto as PatientDTO),
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const createdPatient = await this._patientRepository.create(newPatient);
      return PatientMapper.toDTO(createdPatient);
    } catch {
      throw new Error('Failed to create patient');
    }
  }

  async updatePatient(patientId: string, updates: Partial<PatientDTO>): Promise<PatientDTO | null> {
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
      const updatedPatientEntity = PatientMapper.toEntity({
        ...PatientMapper.toDTO(patient), // Convert current patient to DTO to merge with updates
        ...updates,
      });
      const updatedPatient = await this._patientRepository.update(patientId, {
        ...updatedPatientEntity,
        updatedAt: new Date(),
      });
      if (!updatedPatient) {
        throw new NotFoundError('Failed to update patient');
      }
      return PatientMapper.toDTO(updatedPatient);
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

  async blockPatient(patientId: string, isBlocked: boolean): Promise<PatientDTO | null> {
    if (!patientId) {
      throw new ValidationError('Patient ID is required');
    }

    const patient = await this._patientRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    if (patient.isBlocked === isBlocked) {
      return PatientMapper.toDTO(patient);
    }

    try {
      const updatedPatient = await this._patientRepository.update(patientId, {
        ...patient,
        isBlocked,
        updatedAt: new Date(),
      });
      if (!updatedPatient) {
        throw new NotFoundError(`Failed to ${isBlocked ? 'block' : 'unblock'} patient`);
      }
      return PatientMapper.toDTO(updatedPatient);
    } catch {
      throw new Error(`Failed to ${isBlocked ? 'block' : 'unblock'} patient`);
    }
  }

  async listPatients(params: QueryParams): Promise<PaginatedPatientResponseDTO> {
    const { data, totalItems } = await this._patientRepository.findAllWithQuery(params);
    const patientDTOs = data.map(PatientMapper.toDTO);
    return PatientMapper.toPaginatedResponseDTO(patientDTOs, totalItems, params);
  }

  async getPatientSubscriptions(patientId: string): Promise<PatientSubscriptionDTO[]> {
    if (!patientId) {
      throw new ValidationError('Patient ID is required');
    }

    const subscriptions = await this._patientSubscriptionRepository.findByPatient(patientId);
    return subscriptions.map(PatientSubscriptionMapper.toDTO);
  }

  async getPatientActiveSubscription(patientId: string, doctorId: string): Promise<PatientSubscriptionDTO | null> {
    const subscription = await this._patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, doctorId);
    if (!subscription || !subscription.planId) {
      return null;
    }
    logger.info('subscription:', subscription);
    return PatientSubscriptionMapper.toDTO(subscription);
  }

  async getSubscribedPatients(doctorId: string): Promise<PatientDTO[] | null> {
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
            createdAt: plan.createdAt || new Date(),
            updatedAt: plan.updatedAt || new Date(),
          },
        });
      }
    }

    // Fetch patient details
    const subscribedPatients: PatientDTO[] = [];
    for (const patientId of patientIds) {
      const patient = await this._patientRepository.findById(patientId);
      if (patient) {
        const patientDTO = PatientMapper.toDTO(patient);
        patientDTO.subscribedPlans = patientSubscriptions[patientId].map(PatientSubscriptionMapper.toDTO);
        subscribedPatients.push(patientDTO);
      }
    }

    return subscribedPatients.length > 0 ? subscribedPatients : null;
  }
}
