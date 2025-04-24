// src/core/use-cases/admin/CancelAppointmentUseCase.ts
import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { NotFoundError, ValidationError } from '../../../utils/errors';

export class CancelAppointmentUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async execute(appointmentId: string): Promise<void> {
    const appointment =
      await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }
    if (appointment.status === 'cancelled') {
      throw new ValidationError('Appointment already cancelled');
    }

    await this.appointmentRepository.update(appointmentId, {
      status: 'cancelled',
    });
  }
}
