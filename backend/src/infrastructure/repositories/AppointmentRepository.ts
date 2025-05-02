import { Appointment } from '../../core/entities/Appointment';
import { IAppointmentRepository } from '../../core/interfaces/repositories/IAppointmentRepository';
import { DateUtils } from '../../utils/DateUtils';
import { AppointmentModel } from '../database/models/AppointmentModel';
import { PatientSubscriptionModel } from '../database/models/PatientSubscriptionModel';

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

  async findByDoctorAndSlot(
    doctorId: string,
    date: Date,
    startTime: string,
    endTime: string
  ): Promise<Appointment | null> {
    const normalizedDate = DateUtils.startOfDayUTC(date);
    return AppointmentModel.findOne({
      doctorId,
      date: normalizedDate,
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

  async countByPatientAndDoctorWithFreeBooking(patientId: string, doctorId: string): Promise<number> {
    return AppointmentModel.countDocuments({
      patientId,
      doctorId,
      isFreeBooking: true,
      status: { $ne: 'cancelled' },
    }).exec();
  }

  async update(id: string, updates: Partial<Appointment>): Promise<void> {
    await AppointmentModel.findByIdAndUpdate(id, updates).exec();
  }

  async deleteById(id: string): Promise<void> {
    await AppointmentModel.findByIdAndDelete(id).exec();
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

  async findCompletedAppointmentsBySubscription(
    subscriptionId: string
  ): Promise<Appointment[]> {
    const subscription = await PatientSubscriptionModel.findById(subscriptionId);
    if (!subscription) return [];

    return AppointmentModel.find({
      patientId: subscription.patientId,
      doctorId: {
        $in: await AppointmentModel.find({
          _id: subscription.planId,
        }).distinct('doctorId'),
      },
      status: 'confirmed',
      createdAt: { $gte: subscription.startDate, $lte: subscription.endDate },
    }).exec();
  }
}