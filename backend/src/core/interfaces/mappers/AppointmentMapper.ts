import { Appointment } from '../../entities/Appointment';
import { Prescription } from '../../entities/Prescription';
import { AppointmentDTO, PrescriptionDTO } from '../AppointmentDTOs';

export class AppointmentMapper {
  static toAppointmentDTO(appointment: Appointment): AppointmentDTO {
    return {
      _id: appointment._id?.toString(),
      patientId:
        typeof appointment.patientId === 'string'
          ? appointment.patientId
          : appointment.patientId._id
            ? appointment.patientId._id.toString()
            : '',
      doctorId:
        typeof appointment.doctorId === 'string'
          ? appointment.doctorId
          : appointment.doctorId._id
            ? appointment.doctorId._id.toString()
            : '',
      date: appointment.date.toISOString(),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      isFreeBooking: appointment.isFreeBooking,
      bookingTime: appointment.bookingTime.toISOString(),
      planId: appointment.planId,
      cancellationReason: appointment.cancellationReason,
      prescription:
        appointment.prescriptionId && typeof appointment.prescriptionId !== 'string'
          ? this.toPrescriptionDTO(appointment.prescriptionId)
          : undefined,
      hasReview: appointment.hasReview,
    };
  }

  static toAppointmentEntity(dto: AppointmentDTO): Appointment {
    return {
      _id: dto._id,
      patientId: dto.patientId,
      doctorId: dto.doctorId,
      date: new Date(dto.date),
      startTime: dto.startTime,
      endTime: dto.endTime,
      status: dto.status,
      isFreeBooking: dto.isFreeBooking,
      bookingTime: new Date(dto.bookingTime),
      planId: dto.planId,
      cancellationReason: dto.cancellationReason,
      prescriptionId: dto.prescription ? this.toPrescriptionEntity(dto.prescription) : undefined,
      hasReview: dto.hasReview,
    };
  }

  static toPrescriptionDTO(prescription: Prescription): PrescriptionDTO {
    return {
      _id: prescription._id?.toString(),
      appointmentId: prescription.appointmentId,
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      medications: prescription.medications,
      notes: prescription.notes,
      createdAt: prescription.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: prescription.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  static toPrescriptionEntity(dto: PrescriptionDTO): Prescription {
    return {
      _id: dto._id,
      appointmentId: dto.appointmentId,
      patientId: dto.patientId,
      doctorId: dto.doctorId,
      medications: dto.medications,
      notes: dto.notes,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }
}
