import { Appointment } from '../../entities/Appointment';

export interface IAppointmentRepository {
  create(appointment: Appointment): Promise<Appointment>;
  findByDoctorAndSlot(
    doctorId: string,
    date: Date,
    startTime: string,
    endTime: string
  ): Promise<Appointment | null>;
}
