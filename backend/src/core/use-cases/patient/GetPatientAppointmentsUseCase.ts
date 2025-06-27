import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { Appointment } from '../../entities/Appointment';
import { QueryParams } from '../../../types/authTypes';

export class GetPatientAppointmentsUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async execute(
    patientId: string,
    queryParams: QueryParams
  ): Promise<{ appointments: Appointment[]; totalItems: number }> {
    const result = await this.appointmentRepository.findAllWithQuery({ ...queryParams, patientId });
    return {
      appointments: result.data,
      totalItems: result.totalItems,
    };
  }

  async executeForDoctor(
    patientId: string,
    doctorId: string,
    queryParams: QueryParams
  ): Promise<{ appointments: Appointment[]; totalItems: number }> {
    const result = await this.appointmentRepository.findByPatientAndDoctorWithQuery(patientId, doctorId, queryParams);
    return {
      appointments: result.data,
      totalItems: result.totalItems,
    };
  }
}
