// src/infrastructure/repositories/AppointmentRepository.ts
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

  async confirmAppointment(id: string): Promise<Appointment> {
    const appointment = await AppointmentModel.findByIdAndUpdate(
      id,
      { status: 'confirmed' },
      { new: true }
    ).exec();

    if (!appointment) throw new Error('Appointment not found');

    if (!appointment.isFreeBooking) {
      await PatientSubscriptionModel.findOneAndUpdate(
        {
          patientId: appointment.patientId,
          planId: {
            $in: await AppointmentModel.find({
              doctorId: appointment.doctorId,
            }).distinct('_id'),
          },
          status: 'active',
        },
        { $inc: { appointmentsUsed: 1 } }
      ).exec();
    }

    return appointment;
  }

  async cancelAppointment(id: string): Promise<Appointment> {
    const appointment = await AppointmentModel.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    ).exec();

    if (!appointment) throw new Error('Appointment not found');

    if (!appointment.isFreeBooking && appointment.status === 'confirmed') {
      await PatientSubscriptionModel.findOneAndUpdate(
        {
          patientId: appointment.patientId,
          planId: {
            $in: await AppointmentModel.find({
              doctorId: appointment.doctorId,
            }).distinct('_id'),
          },
          status: 'active',
        },
        { $inc: { appointmentsUsed: -1 } }
      ).exec();
    }

    return appointment;
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