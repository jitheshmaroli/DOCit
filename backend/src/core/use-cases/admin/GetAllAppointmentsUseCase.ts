import { QueryParams } from '../../../types/authTypes';
import { Appointment } from '../../entities/Appointment';
import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';

export class GetAllAppointmentsUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async executeWithQuery(params: QueryParams): Promise<{ data: Appointment[]; totalItems: number }> {
    return this.appointmentRepository.findAllWithQuery(params);
  }
}
