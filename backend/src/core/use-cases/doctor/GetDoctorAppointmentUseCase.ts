import { Appointment } from '../../entities/Appointment';
import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';

export class GetDoctorAppointmentsUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async execute(doctorId: string): Promise<Appointment[]> {
    return this.appointmentRepository.findByDoctor(doctorId);
  }
}