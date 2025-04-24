import { Appointment } from '../../core/entities/Appointment';
import { IAppointmentRepository } from '../../core/interfaces/repositories/IAppointmentRepository';
import { AppointmentModel } from '../database/models/AppointmentModel';
import { DateUtils } from '../../utils/DateUtils';

export class AppointmentRepository implements IAppointmentRepository {
  async create(appointment: Appointment): Promise<Appointment> {
    const newAppointment = new AppointmentModel({
      ...appointment,
      date: DateUtils.startOfDayUTC(appointment.date),
    });
    return newAppointment.save();
  }

  async findById(id: string): Promise<Appointment | null> {
    return AppointmentModel.findById(id).exec();
  }

  async findByDoctorAndSlot(doctorId: string, date: Date, startTime: string, endTime: string): Promise<Appointment | null> {
    const startOfDay = DateUtils.startOfDayUTC(date);
    const endOfDay = DateUtils.endOfDayUTC(date);
    return AppointmentModel.findOne({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      startTime,
      endTime,
      status: { $ne: 'cancelled' },
    }).exec();
  }

  async countByPatientAndDoctor(patientId: string, doctorId: string): Promise<number> {
    return AppointmentModel.countDocuments({
      patientId,
      doctorId,
      status: { $ne: 'cancelled' },
    }).exec();
  }

  async update(id: string, updates: Partial<Appointment>): Promise<void> {
    await AppointmentModel.findByIdAndUpdate(id, updates).exec();
  }

  async findByPatient(patientId: string): Promise<Appointment[]> {
    return AppointmentModel.find({ patientId }).exec();
  }

  async findByPatientAndDoctor(patientId: string, doctorId: string): Promise<Appointment[]> {
    return AppointmentModel.find({ patientId, doctorId }).exec();
  }

  async findByDoctor(doctorId: string): Promise<Appointment[]> {
    return AppointmentModel.find({ doctorId }).exec();
  }

  async findAll(): Promise<Appointment[]> {
    return AppointmentModel.find().exec();
  }
}