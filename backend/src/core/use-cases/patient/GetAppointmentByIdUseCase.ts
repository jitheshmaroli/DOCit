import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { Appointment } from '../../entities/Appointment';
import { ValidationError } from '../../../utils/errors';

export class GetAppointmentByIdUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async execute(appointmentId: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new ValidationError('No appointment found');
    }
    return appointment;
  }
}
