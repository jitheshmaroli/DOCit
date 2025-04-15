import { Appointment } from '../../entities/Appointment';
import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';

export class GetAllAppointmentsUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async execute(): Promise<Appointment[]> {
    return this.appointmentRepository.findAll();
  }
}