import { QueryParams } from '../../../types/authTypes';
import { Appointment } from '../../entities/Appointment';
import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';

export class GetDoctorAppointmentsUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async execute(doctorId: string, params: QueryParams = {}): Promise<{ data: Appointment[]; totalItems: number }> {
    return this.appointmentRepository.findByDoctorWithQuery(doctorId, params);
  }
}
