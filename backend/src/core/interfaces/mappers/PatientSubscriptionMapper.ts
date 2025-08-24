import { PatientSubscription } from '../../entities/PatientSubscription';
import { PatientSubscriptionDTO } from '../PatientDTOs';

export class PatientSubscriptionMapper {
  static toDTO(entity: PatientSubscription): PatientSubscriptionDTO {
    return {
      _id: entity._id,
      patientId: entity.patientId,
      planId: entity.planId,
      planDetails: entity.planDetails,
      startDate: entity.startDate,
      endDate: entity.endDate,
      status: entity.status,
      price: entity.price,
      appointmentsUsed: entity.appointmentsUsed,
      appointmentsLeft: entity.appointmentsLeft,
      stripePaymentId: entity.stripePaymentId,
      remainingDays: entity.remainingDays,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      cancellationReason: entity.cancellationReason,
    };
  }

  static toEntity(dto: PatientSubscriptionDTO): PatientSubscription {
    return {
      _id: dto._id,
      patientId: dto.patientId,
      planId: dto.planId,
      planDetails: dto.planDetails,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      status: dto.status,
      price: dto.price,
      appointmentsUsed: dto.appointmentsUsed,
      appointmentsLeft: dto.appointmentsLeft,
      stripePaymentId: dto.stripePaymentId,
      remainingDays: dto.remainingDays,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
      cancellationReason: dto.cancellationReason,
    };
  }
}
