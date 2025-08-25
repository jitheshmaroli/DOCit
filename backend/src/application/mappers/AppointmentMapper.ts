import { Appointment } from '../../core/entities/Appointment';
import { Prescription } from '../../core/entities/Prescription';
import { AppointmentDTO, AppointmentPatientDTO, AppointmentDoctorDTO, PrescriptionDTO } from '../dtos/AppointmentDTOs';
import { Patient } from '../../core/entities/Patient';
import { Doctor } from '../../core/entities/Doctor';

export class AppointmentMapper {
  static toAppointmentDTO(appointment: Appointment): AppointmentDTO {
    const patientId: AppointmentPatientDTO = {
      _id:
        typeof appointment.patientId === 'string'
          ? appointment.patientId
          : (appointment.patientId?._id?.toString() ?? ''),
      name:
        typeof appointment.patientId !== 'string' && appointment.patientId?.name
          ? appointment.patientId.name
          : (appointment.patientName ?? 'N/A'),
      profilePicture: typeof appointment.patientId !== 'string' ? appointment.patientId?.profilePicture : undefined,
    };

    const doctorId: AppointmentDoctorDTO = {
      _id:
        typeof appointment.doctorId === 'string' ? appointment.doctorId : (appointment.doctorId?._id?.toString() ?? ''),
      name:
        typeof appointment.doctorId !== 'string' && appointment.doctorId?.name
          ? appointment.doctorId.name
          : (appointment.doctorName ?? 'N/A'),
      profilePicture: typeof appointment.doctorId !== 'string' ? appointment.doctorId?.profilePicture : undefined,
      speciality: typeof appointment.doctorId !== 'string' ? appointment.doctorId?.speciality : undefined,
      qualifications: typeof appointment.doctorId !== 'string' ? appointment.doctorId?.qualifications : undefined,
      gender: typeof appointment.doctorId !== 'string' ? appointment.doctorId?.gender : undefined,
    };

    return {
      _id: appointment._id?.toString(),
      patientId,
      doctorId,
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
    const patientId: string | Patient =
      typeof dto.patientId === 'string'
        ? dto.patientId
        : {
            _id: dto.patientId._id,
            email: '',
            name: dto.patientId.name,
            profilePicture: dto.patientId.profilePicture,
          };

    const doctorId: string | Doctor =
      typeof dto.doctorId === 'string'
        ? dto.doctorId
        : {
            _id: dto.doctorId._id,
            email: '',
            name: dto.doctorId.name,
            profilePicture: dto.doctorId.profilePicture,
            speciality: dto.doctorId.speciality,
            qualifications: dto.doctorId.qualifications,
            gender: dto.doctorId.gender,
          };

    return {
      _id: dto._id,
      patientId,
      doctorId,
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
      patientName: typeof dto.patientId !== 'string' ? dto.patientId.name : undefined,
      doctorName: typeof dto.doctorId !== 'string' ? dto.doctorId.name : undefined,
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
