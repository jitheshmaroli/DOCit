import { PatientSubscription } from '../../core/entities/PatientSubscription';
import { PatientSubscriptionDTO } from '../dtos/PatientDTOs';

export class PatientSubscriptionMapper {
  static toDTO(entity: PatientSubscription): PatientSubscriptionDTO {
    return {
      _id: entity._id,
      patientId: entity.patientId?.toString() ?? '',
      planId: entity.planId?.toString() ?? '',
      planDetails: entity.planDetails,
      startDate: entity.startDate?.toISOString(),
      endDate: entity.endDate?.toISOString(),
      status: entity.status,
      price: entity.price,
      appointmentsUsed: entity.appointmentsUsed,
      appointmentsLeft: entity.appointmentsLeft,
      stripePaymentId: entity.stripePaymentId,
      remainingDays: entity.remainingDays,
      createdAt: entity.createdAt?.toISOString(),
      updatedAt: entity.updatedAt?.toISOString(),
      cancellationReason: entity.cancellationReason,
      refundId: entity.refundId?.toString(),
      refundAmount: entity.refundAmount,
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
