import { Appointment } from '../../core/entities/Appointment';
import { Prescription } from '../../core/entities/Prescription';
import { AppointmentDTO, PrescriptionDTO } from '../dtos/AppointmentDTOs';

export class AppointmentMapper {
  static toAppointmentDTO(appointment: Appointment): AppointmentDTO {
    const dto: AppointmentDTO = {
      _id: appointment._id?.toString(),
      patientId: appointment.patientId ?? '',
      doctorId: appointment.doctorId ?? '',
      date: appointment.date.toISOString(),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      isFreeBooking: appointment.isFreeBooking,
      bookingTime: appointment.bookingTime.toISOString(),
      planId: appointment.planId,
      cancellationReason: appointment.cancellationReason,
      prescriptionId: appointment.prescriptionId,
      hasReview: appointment.hasReview,
    };

    return dto;
  }

  static toPrescriptionDTO(prescription: Prescription): PrescriptionDTO {
    return {
      _id: prescription._id?.toString(),
      appointmentId: prescription.appointmentId,
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      medications: prescription.medications,
      notes: prescription.notes,
      pdfUrl: prescription.pdfUrl,
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
      prescriptionId: dto.prescriptionId,
      hasReview: dto.hasReview,
    };
  }

  static toPrescriptionEntity(
    dto: PrescriptionDTO
  ): Omit<Prescription, '_id' | 'appointmentId' | 'patientId' | 'doctorId' | 'createdAt' | 'updatedAt' | 'pdfUrl'> {
    return {
      medications: dto.medications,
      notes: dto.notes,
    };
  }
}
