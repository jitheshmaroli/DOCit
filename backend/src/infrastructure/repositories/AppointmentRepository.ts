import moment from 'moment';
import { Appointment } from '../../core/entities/Appointment';
import { IAppointmentRepository } from '../../core/interfaces/repositories/IAppointmentRepository';
import { AppointmentModel } from '../database/models/AppointmentModel';

export class AppointmentRepository implements IAppointmentRepository {
  async create(appointment: Appointment): Promise<Appointment> {
    const newAppointment = new AppointmentModel(appointment);
    return newAppointment.save();
  }

  async findById(id: string): Promise<Appointment | null> {
    return AppointmentModel.findById(id).exec();
  }

  async findByDoctorAndSlot(
    doctorId: string,
    date: Date,
    startTime: string,
    endTime: string
  ): Promise<Appointment | null> {
    return AppointmentModel.findOne({
      doctorId,
      date: {
        $gte: moment(date).startOf('day').toDate(),
        $lte: moment(date).endOf('day').toDate(),
      },
      startTime,
      endTime,
      status: { $ne: 'cancelled' },
    }).exec();
  }

  async countByPatientAndDoctor(
    patientId: string,
    doctorId: string
  ): Promise<number> {
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

  async findByDoctor(doctorId: string): Promise<Appointment[]> {
    return AppointmentModel.find({ doctorId }).exec();
  }

  async findAll(): Promise<Appointment[]> {
    return AppointmentModel.find().exec();
  }
}
