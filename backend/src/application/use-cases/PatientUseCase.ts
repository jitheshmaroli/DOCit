import { IPatientUseCase } from '../../core/interfaces/use-cases/IPatientUseCase';
import { PatientSubscription } from '../../core/entities/PatientSubscription';
import { IPatientRepository } from '../../core/interfaces/repositories/IPatientRepository';
import { IPatientSubscriptionRepository } from '../../core/interfaces/repositories/IPatientSubscriptionRepository';
import { ISubscriptionPlanRepository } from '../../core/interfaces/repositories/ISubscriptionPlanRepository';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { StripeService } from '../../infrastructure/services/StripeService';
import { QueryParams } from '../../types/authTypes';
import { NotFoundError, ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';
import { PatientDTO, PatientSubscriptionDTO, PaginatedPatientResponseDTO } from '../dtos/PatientDTOs';
import { PatientMapper } from '../mappers/PatientMapper';
import { PatientSubscriptionMapper } from '../mappers/PatientSubscriptionMapper';
import { IAppointmentRepository } from '../../core/interfaces/repositories/IAppointmentRepository';
import { IValidatorService } from '../../core/interfaces/services/IValidatorService';
import Stripe from 'stripe';

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

interface PaymentIntentWithCharges extends Stripe.PaymentIntent {
  charges?: {
    data: Stripe.Charge[];
  };
}

export class PatientUseCase implements IPatientUseCase {
  constructor(
    private _patientRepository: IPatientRepository,
    private _patientSubscriptionRepository: IPatientSubscriptionRepository,
    private _appointmentRepository: IAppointmentRepository,
    private _validatorService: IValidatorService,
    private _subscriptionPlanRepository: ISubscriptionPlanRepository,
    private _doctorRepository: IDoctorRepository,
    private _stripeService: StripeService
  ) {}

  async createPatient(dto: Partial<PatientDTO>): Promise<PatientDTO> {
    // Validate required fields
    this._validatorService.validateRequiredFields({
      email: dto.email,
      name: dto.name,
      password: dto.password,
    });

    // Validate email, name, and password
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

    try {
      const createdPatient = await this._patientRepository.create(newPatient);
      return PatientMapper.toDTO(createdPatient);
    } catch {
      throw new Error('Failed to create patient');
    }
  }

  async updatePatient(patientId: string, updates: Partial<PatientDTO>): Promise<PatientDTO | null> {
    // Validate patientId
    this._validatorService.validateRequiredFields({ patientId });
    this._validatorService.validateIdFormat(patientId);

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
    } catch {
      throw new Error('Failed to update patient');
    }
  }

  async deletePatient(patientId: string): Promise<void> {
    // Validate patientId
    this._validatorService.validateRequiredFields({ patientId });
    this._validatorService.validateIdFormat(patientId);

    const patient = await this._patientRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    await this._patientRepository.delete(patientId);
  }

  async blockPatient(patientId: string, isBlocked: boolean): Promise<PatientDTO | null> {
    // Validate patientId and isBlocked
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
    // No specific validation for QueryParams, as it's typically flexible
    const { data, totalItems } = await this._patientRepository.findAllWithQuery(params);
    const patientDTOs = data.map(PatientMapper.toDTO);
    return PatientMapper.toPaginatedResponseDTO(patientDTOs, totalItems, params);
  }

  async getPatientSubscriptions(patientId: string): Promise<PatientSubscriptionDTO[]> {
    // Validate patientId
    this._validatorService.validateRequiredFields({ patientId });
    this._validatorService.validateIdFormat(patientId);

    const subscriptions = await this._patientSubscriptionRepository.findByPatient(patientId);
    logger.info('sub::', subscriptions);
    return subscriptions.map(PatientSubscriptionMapper.toDTO);
  }

  async getAppointedPatients(doctorId: string, params: QueryParams): Promise<PaginatedPatientResponseDTO> {
    // Validate doctorId
    this._validatorService.validateRequiredFields({ doctorId });
    this._validatorService.validateIdFormat(doctorId);

    const distinctPatientIds = await this._appointmentRepository.getDistinctPatientIdsByDoctor(doctorId);
    const extendedParams = { ...params, ids: distinctPatientIds };
    const result = await this._patientRepository.findAllWithQuery(extendedParams);
    return PatientMapper.toPaginatedResponseDTO(result.data.map(PatientMapper.toDTO), result.totalItems, params);
  }

  async getPatientActiveSubscription(patientId: string, doctorId: string): Promise<PatientSubscriptionDTO | null> {
    // Validate patientId and doctorId
    this._validatorService.validateRequiredFields({ patientId, doctorId });
    this._validatorService.validateIdFormat(patientId);
    this._validatorService.validateIdFormat(doctorId);

    const subscription = await this._patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, doctorId);
    if (!subscription || !subscription.planId) {
      return null;
    }
    logger.info('subscription:', subscription);
    return PatientSubscriptionMapper.toDTO(subscription);
  }

  async getSubscribedPatients(doctorId: string): Promise<PatientDTO[] | null> {
    // Validate doctorId
    this._validatorService.validateRequiredFields({ doctorId });
    this._validatorService.validateIdFormat(doctorId);

    // Fetch active subscriptions with populated planId
    const activeSubscriptions = await this._patientSubscriptionRepository.findActiveSubscriptions();
    const patientIds: string[] = [];
    const patientSubscriptions: { [patientId: string]: PatientSubscription[] } = {};

    // Filter subscriptions by doctorId and collect patient IDs
    for (const sub of activeSubscriptions) {
      const plan = sub.planId as unknown as PopulatedPlan;
      if (plan) {
        // Validate plan fields
        this._validatorService.validateRequiredFields({
          planId: plan._id,
          doctorId: plan.doctorId,
          name: plan.name,
          price: plan.price,
          validityDays: plan.validityDays,
          appointmentCount: plan.appointmentCount,
          status: plan.status,
        });
        this._validatorService.validateIdFormat(plan._id);
        this._validatorService.validateIdFormat(plan.doctorId);
        this._validatorService.validateEnum(plan.status, ['pending', 'approved', 'rejected']);
        this._validatorService.validatePositiveNumber(plan.price);
        this._validatorService.validatePositiveInteger(plan.validityDays);
        this._validatorService.validatePositiveInteger(plan.appointmentCount);

        if (plan.doctorId === doctorId) {
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

    // Validate patientIds
    for (const patientId of patientIds) {
      this._validatorService.validateIdFormat(patientId);
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
    // Validate inputs
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
