import { IPatientUseCase } from '../../core/interfaces/use-cases/IPatientUseCase';
import { PatientSubscription } from '../../core/entities/PatientSubscription';
import { IPatientRepository } from '../../core/interfaces/repositories/IPatientRepository';
import { IPatientSubscriptionRepository } from '../../core/interfaces/repositories/IPatientSubscriptionRepository';
import { QueryParams } from '../../types/authTypes';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { PatientDTO, PatientSubscriptionDTO, PaginatedPatientResponseDTO } from '../dtos/PatientDTOs';
import { PatientMapper } from '../mappers/PatientMapper';
import { PatientSubscriptionMapper } from '../mappers/PatientSubscriptionMapper';
import { IValidatorService } from '../../core/interfaces/services/IValidatorService';
import Stripe from 'stripe';
import { StripeService } from '../../infrastructure/services/StripeService';
import { IAppointmentRepository } from '../../core/interfaces/repositories/IAppointmentRepository';
import { ISubscriptionPlanRepository } from '../../core/interfaces/repositories/ISubscriptionPlanRepository';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';

interface PaymentIntentWithCharges extends Stripe.PaymentIntent {
  charges?: {
    data: Stripe.Charge[];
  };
}

export class PatientUseCase implements IPatientUseCase {
  constructor(
    private _patientRepository: IPatientRepository,
    private _patientSubscriptionRepository: IPatientSubscriptionRepository,
    private _validatorService: IValidatorService,
    private _stripeService: StripeService,
    private _appointmentRepository: IAppointmentRepository,
    private _subscriptionPlanRepository: ISubscriptionPlanRepository,
    private _doctorRepository: IDoctorRepository
  ) {}

  async createPatient(dto: Partial<PatientDTO>): Promise<PatientDTO> {
    // Validations
    this._validatorService.validateRequiredFields({
      email: dto.email,
      name: dto.name,
      password: dto.password,
    });
    this._validatorService.validateEmailFormat(dto.email!);
    this._validatorService.validateName(dto.name!);
    this._validatorService.validatePassword(dto.password!);

    const existingPatient = await this._patientRepository.findByEmail(dto.email!);
    if (existingPatient) {
      throw new ValidationError('Patient with this email already exists');
    }

    const newPatient = {
      ...PatientMapper.toEntity(dto as PatientDTO),
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdPatient = await this._patientRepository.create(newPatient);
    return PatientMapper.toDTO(createdPatient);
  }

  async updatePatient(patientId: string, updates: Partial<PatientDTO>): Promise<PatientDTO | null> {
    // Validations
    this._validatorService.validateRequiredFields({ patientId });
    this._validatorService.validateIdFormat(patientId);

    if (updates.email) {
      this._validatorService.validateEmailFormat(updates.email);
    }
    if (updates.name) {
      this._validatorService.validateName(updates.name);
    }
    if (updates.password) {
      this._validatorService.validatePassword(updates.password);
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

    const updatedPatientEntity = PatientMapper.toEntity({
      ...PatientMapper.toDTO(patient),
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
  }

  async deletePatient(patientId: string): Promise<void> {
    // Validations
    this._validatorService.validateRequiredFields({ patientId });
    this._validatorService.validateIdFormat(patientId);

    const patient = await this._patientRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    await this._patientRepository.delete(patientId);
  }

  async blockPatient(patientId: string, isBlocked: boolean): Promise<PatientDTO | null> {
    // Validations
    this._validatorService.validateRequiredFields({ patientId, isBlocked });
    this._validatorService.validateIdFormat(patientId);
    this._validatorService.validateBoolean(isBlocked);

    const patient = await this._patientRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    if (patient.isBlocked === isBlocked) {
      return PatientMapper.toDTO(patient);
    }

    const updatedPatient = await this._patientRepository.update(patientId, {
      ...patient,
      isBlocked,
      updatedAt: new Date(),
    });
    if (!updatedPatient) {
      throw new NotFoundError(`Failed to ${isBlocked ? 'block' : 'unblock'} patient`);
    }
    return PatientMapper.toDTO(updatedPatient);
  }

  async listPatients(params: QueryParams): Promise<PaginatedPatientResponseDTO> {
    const { data, totalItems } = await this._patientRepository.findAllWithQuery(params);
    const patientDTOs = data.map(PatientMapper.toDTO);
    return PatientMapper.toPaginatedResponseDTO(patientDTOs, totalItems, params);
  }

  async getPatientSubscriptions(patientId: string): Promise<PatientSubscriptionDTO[]> {
    // Validations
    this._validatorService.validateRequiredFields({ patientId });
    this._validatorService.validateIdFormat(patientId);

    const subscriptions = await this._patientSubscriptionRepository.findByPatient(patientId);

    return subscriptions.map(PatientSubscriptionMapper.toDTO);
  }

  async getAppointedPatients(doctorId: string, params: QueryParams): Promise<PaginatedPatientResponseDTO> {
    // Validations
    this._validatorService.validateRequiredFields({ doctorId });
    this._validatorService.validateIdFormat(doctorId);

    const distinctPatientIds = await this._appointmentRepository.getDistinctPatientIdsByDoctor(doctorId);
    const extendedParams = { ...params, ids: distinctPatientIds };
    const result = await this._patientRepository.findAllWithQuery(extendedParams);
    return PatientMapper.toPaginatedResponseDTO(result.data.map(PatientMapper.toDTO), result.totalItems, params);
  }

  async getPatientActiveSubscription(patientId: string, doctorId: string): Promise<PatientSubscriptionDTO | null> {
    // Validations
    this._validatorService.validateRequiredFields({ patientId, doctorId });
    this._validatorService.validateIdFormat(patientId);
    this._validatorService.validateIdFormat(doctorId);

    const subscription = await this._patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, doctorId);
    if (!subscription || !subscription.planId) {
      return null;
    }
    return PatientSubscriptionMapper.toDTO(subscription);
  }

  async getSubscribedPatients(doctorId: string): Promise<PatientDTO[] | null> {
    // Validations
    this._validatorService.validateRequiredFields({ doctorId });
    this._validatorService.validateIdFormat(doctorId);

    const activeSubscriptions = await this._patientSubscriptionRepository.findActiveSubscriptions();
    const patientIds: string[] = [];
    const patientSubscriptions: { [patientId: string]: PatientSubscription[] } = {};

    for (const sub of activeSubscriptions) {
      const plan = sub.planDetails;
      if (plan) {
        if (plan.doctorId?.toString() === doctorId) {
          if (!patientSubscriptions[sub.patientId!]) {
            patientIds.push(sub.patientId!);
            patientSubscriptions[sub.patientId!] = [];
          }
          patientSubscriptions[sub.patientId!].push({
            ...sub,
            planId: sub.planId as string,
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
    }

    for (const patientId of patientIds) {
      this._validatorService.validateIdFormat(patientId.toString());
    }

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

  async getInvoiceDetails(
    patientId: string,
    paymentIntentId: string
  ): Promise<{
    paymentIntentId: string;
    amount: number;
    cardLast4?: string;
    date: string;
    planName?: string;
    doctorName?: string;
    status: string;
    cancellationReason?: string;
    remainingDays?: number;
  }> {
    // Validations
    this._validatorService.validateRequiredFields({ patientId, paymentIntentId });
    this._validatorService.validateIdFormat(patientId);
    this._validatorService.validateLength(paymentIntentId, 1, 100);

    const subscription = await this._patientSubscriptionRepository.findByStripePaymentId(paymentIntentId);
    if (!subscription) {
      throw new NotFoundError('Invoice not found');
    }
    if (subscription.patientId !== patientId) {
      throw new ValidationError('Unauthorized to view this invoice');
    }

    const plan = await this._subscriptionPlanRepository.findById(subscription.planId as string);
    const doctor = await this._doctorRepository.findById(plan?.doctorId || '');
    const paymentIntent = (await this._stripeService.retrievePaymentIntent(paymentIntentId, {
      expand: ['charges'],
    })) as PaymentIntentWithCharges;
    let cardLast4: string | undefined = 'N/A';
    if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'string') {
      const paymentMethod = await this._stripeService.paymentMethodsRetrieve(paymentIntent.payment_method);
      if (paymentMethod.card) {
        cardLast4 = paymentMethod.card.last4 || 'N/A';
      }
    } else if (paymentIntent.charges?.data?.length) {
      const charge = paymentIntent.charges.data[0];
      if (charge.payment_method_details?.card) {
        cardLast4 = charge.payment_method_details.card.last4 || 'N/A';
      }
    }

    return {
      paymentIntentId,
      amount: subscription.price,
      cardLast4,
      date: subscription.createdAt?.toISOString() || new Date().toISOString(),
      planName: plan?.name || 'N/A',
      doctorName: doctor?.name || 'N/A',
      status: subscription.status,
      cancellationReason: subscription.cancellationReason,
      remainingDays: subscription.remainingDays || 0,
    };
  }
}
