import { Appointment } from '../../core/entities/Appointment';
import { IAppointmentRepository } from '../../core/interfaces/repositories/IAppointmentRepository';
import { QueryParams } from '../../types/authTypes';
import { DateUtils } from '../../utils/DateUtils';
import { QueryBuilder } from '../../utils/queryBuilder';
import { AppointmentModel } from '../database/models/AppointmentModel';
import { DoctorModel } from '../database/models/DoctorModel';
import { PatientModel } from '../database/models/PatientModel';
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
    return AppointmentModel.findById(id)
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .exec();
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
    })
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .exec();
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

  async countByPatientAndDoctorWithFreeBooking(
    patientId: string,
    doctorId: string
  ): Promise<number> {
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
    return AppointmentModel.find({ patientId })
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .exec();
  }

  async findByPatientAndDoctor(
    patientId: string,
    doctorId: string
  ): Promise<Appointment[]> {
    return AppointmentModel.find({ patientId, doctorId })
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .exec();
  }

  async findByDoctor(doctorId: string): Promise<Appointment[]> {
    return AppointmentModel.find({ doctorId })
      .populate({
        path: 'patientId',
        select: '-refreshToken -password',
      })
      .populate('doctorId', 'name')
      .exec();
  }

  async findAllWithQuery(
    params: QueryParams
  ): Promise<{ data: Appointment[]; totalItems: number }> {
    const { search } = params;
    const sort = QueryBuilder.buildSort(params);
    const { page, limit } = QueryBuilder.validateParams(params);

    const query = QueryBuilder.buildQuery(params);
    delete query.$or;

    if (search) {
      const patientIds = await PatientModel.find(
        { name: { $regex: search, $options: 'i' } },
        '_id'
      ).exec();
      const doctorIds = await DoctorModel.find(
        { name: { $regex: search, $options: 'i' } },
        '_id'
      ).exec();

      query.$or = [
        { patientId: { $in: patientIds.map((p: any) => p._id) } },
        { doctorId: { $in: doctorIds.map((d: any) => d._id) } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const appointments = await AppointmentModel.find(query)
      .populate({ path: 'patientId', select: 'name' })
      .populate({ path: 'doctorId', select: 'name' })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const totalItems = await AppointmentModel.countDocuments(query).exec();

    return { data: appointments, totalItems };
  }

  async findCompletedAppointmentsBySubscription(
    subscriptionId: string
  ): Promise<Appointment[]> {
    const subscription =
      await PatientSubscriptionModel.findById(subscriptionId);
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
    })
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .exec();
  }
}
