import { Appointment } from '../../entities/Appointment';

export interface IAppointmentRepository {
  create(appointment: Appointment): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  findByDoctorAndSlot(
    doctorId: string,
    date: Date,
    startTime: string,
    endTime: string
  ): Promise<Appointment | null>;
  countByPatientAndDoctor(patientId: string, doctorId: string): Promise<number>;
  update(id: string, updates: Partial<Appointment>): Promise<void>;
  findByPatient(patientId: string): Promise<Appointment[]>;
  findByPatientAndDoctor(patientId: string, doctorId: string): Promise<Appointment[]>;
  findByDoctor(doctorId: string): Promise<Appointment[]>;
  findAll(): Promise<Appointment[]>;
}
