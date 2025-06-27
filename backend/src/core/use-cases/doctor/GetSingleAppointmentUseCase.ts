import { AppointmentRepository } from '../../../infrastructure/repositories/AppointmentRepository';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { Appointment } from '../../entities/Appointment';

export class GetSingleAppointmentUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(doctorId: string, appointmentId: string): Promise<Appointment> {
    if (!appointmentId) {
      throw new ValidationError('Appointment ID is required');
    }

    const appointment = await this.appointmentRepository.findById(appointmentId);

    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    // if (appointment.doctorId.toString() !== doctorId) {
    //   throw new ValidationError('Unauthorized access to appointment');
    // }

    return appointment;
  }
}
