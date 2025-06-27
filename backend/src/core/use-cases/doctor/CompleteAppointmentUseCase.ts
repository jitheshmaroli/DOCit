import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { Appointment } from '../../entities/Appointment';
import { Prescription } from '../../entities/Prescription';

export class CompleteAppointmentUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async execute(
    doctorId: string,
    appointmentId: string,
    prescription: Omit<Prescription, '_id' | 'appointmentId' | 'patientId' | 'doctorId' | 'createdAt' | 'updatedAt'>
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // if (appointment.doctorId !== doctorId) {
    //   throw new Error('Unauthorized: Doctor ID does not match');
    // }

    if (appointment.status !== 'pending') {
      throw new Error('Only pending appointments can be marked as completed');
    }

    return await this.appointmentRepository.completeAppointmentAndCreatePrescription(appointmentId, prescription);
  }
}
