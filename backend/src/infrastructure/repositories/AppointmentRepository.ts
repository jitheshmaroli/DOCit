import mongoose, { FilterQuery } from 'mongoose';
import { IAppointmentRepository } from '../../core/interfaces/repositories/IAppointmentRepository';
import { Appointment } from '../../core/entities/Appointment';
import { QueryParams } from '../../types/authTypes';
import { DateUtils } from '../../utils/DateUtils';
import { AppointmentModel } from '../database/models/AppointmentModel';
import { PatientModel } from '../database/models/PatientModel';
import { DoctorModel } from '../database/models/DoctorModel';
import { BaseRepository } from './BaseRepository';
import { AppointmentStatus } from '../../application/dtos/AppointmentDTOs';
import { PrescriptionModel } from '../database/models/PrescriptionModel';
import { ObjectId } from 'mongodb';
import { PipelineStage } from 'mongoose';

export class AppointmentRepository extends BaseRepository<Appointment> implements IAppointmentRepository {
  constructor() {
    super(AppointmentModel);
  }

  async create(appointment: Appointment): Promise<Appointment> {
    const newAppointment = new this.model({
      ...appointment,
      date: DateUtils.startOfDayUTC(appointment.date),
    });
    const savedAppointment = await newAppointment.save();
    return savedAppointment.toObject() as Appointment;
  }

  async findByIdPopulated(appointmentId: string): Promise<Appointment | null> {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) return null;
    const appointment = await this.model
      .findById(appointmentId)
      .populate('patientId')
      .populate('doctorId')
      .populate('patientSubscriptionId')
      .populate({
        path: 'prescriptionId',
        model: PrescriptionModel,
        select: '_id appointmentId patientId doctorId medications notes pdfUrl createdAt updatedAt',
      })
      .exec();
    return (appointment as Appointment) ?? null;
  }

  async findUpcomingAppointments(start: Date, end: Date): Promise<Appointment[]> {
    const startOfDay = DateUtils.startOfDayUTC(start);
    const endOfDay = DateUtils.endOfDayUTC(end);

    const appointments = await this.model
      .find({
        date: { $gte: startOfDay, $lte: endOfDay },
        status: 'pending',
      })
      .populate('patientId', 'name')
      .populate('doctorId', 'name profilePicture speciality qualifications gender')
      .exec();

    const filteredAppointments = appointments.filter((appt) => {
      try {
        const appointmentDateTime = DateUtils.combineDateAndTime(appt.date, appt.startTime);
        return appointmentDateTime >= start && appointmentDateTime <= end;
      } catch (error) {
        console.error(`Invalid startTime for appointment ${appt._id}: ${appt.startTime}`, error);
        return false;
      }
    });

    return filteredAppointments.map((appt) => appt.toObject() as Appointment);
  }

  async findByDoctorAndSlot(
    doctorId: string,
    date: Date,
    startTime: string,
    endTime: string
  ): Promise<Appointment | null> {
    const normalizedDate = DateUtils.startOfDayUTC(date);
    const appointment = await this.model
      .findOne({
        doctorId,
        date: normalizedDate,
        startTime,
        endTime,
        status: { $ne: 'cancelled' },
      })
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .exec();
    return appointment ? (appointment.toObject() as Appointment) : null;
  }

  async countByPatientAndDoctor(patientId: string, doctorId: string): Promise<number> {
    return this.model
      .countDocuments({
        patientId,
        doctorId,
        status: { $ne: 'cancelled' },
      })
      .exec();
  }

  async countByPatientAndDoctorWithFreeBooking(patientId: string, doctorId: string): Promise<number> {
    return this.model
      .countDocuments({
        patientId,
        doctorId,
        isFreeBooking: true,
        status: { $ne: 'cancelled' },
      })
      .exec();
  }

  async findBySubscriptionWithQuery(
    subscriptionId: string,
    params: QueryParams
  ): Promise<{ data: Appointment[]; totalItems: number }> {
    const { page = 1, limit = 10, status } = params;

    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
      return { data: [], totalItems: 0 };
    }

    const matchStage: Record<string, unknown> = {
      patientSubscriptionId: new ObjectId(subscriptionId),
    };

    if (status !== undefined) {
      matchStage.status = status;
    }

    const pipeline: PipelineStage[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'prescriptions',
          localField: 'prescriptionId',
          foreignField: '_id',
          as: 'prescription',
        },
      },
      { $unwind: { path: '$prescription', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'patients',
          localField: 'patientId',
          foreignField: '_id',
          as: 'patientId',
        },
      },
      { $unwind: { path: '$patientId', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctorId',
        },
      },
      { $unwind: { path: '$doctorId', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          patientId: { _id: '$patientId._id', name: '$patientId.name' },
          doctorId: { _id: '$doctorId._id', name: '$doctorId.name' },
          date: 1,
          startTime: 1,
          endTime: 1,
          status: 1,
          isFreeBooking: 1,
          bookingTime: 1,
          patientSubscriptionId: 1,
          cancellationReason: 1,
          prescriptionId: 1,
          prescription: {
            _id: '$prescription._id',
            appointmentId: '$prescription.appointmentId',
            patientId: '$prescription.patientId',
            doctorId: '$prescription.doctorId',
            medications: '$prescription.medications',
            notes: '$prescription.notes',
            pdfUrl: '$prescription.pdfUrl',
            createdAt: '$prescription.createdAt',
            updatedAt: '$prescription.updatedAt',
          },
          hasReview: 1,
        },
      },
      {
        $facet: {
          data: [{ $sort: { createdAt: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit }],
          totalItems: [{ $count: 'count' }],
        },
      },
    ];

    const result = await this.model.aggregate(pipeline).exec();

    const data = result[0]?.data || [];
    const totalItems = result[0]?.totalItems[0]?.count || 0;

    return {
      data: data as Appointment[],
      totalItems,
    };
  }

  async findByPatient(patientId: string): Promise<Appointment[]> {
    const appointments = await this.model
      .find({ patientId })
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .exec();
    return appointments.map((appt) => appt.toObject() as Appointment);
  }

  async getDistinctPatientIdsByDoctor(doctorId: string): Promise<string[]> {
    const results = await this.model.aggregate([
      { $match: { doctorId } },
      { $group: { _id: '$patientId' } },
      { $project: { _id: 1 } },
    ]);
    return results.map((r) => r._id.toString());
  }

  async findByPatientAndDoctorWithQuery(
    patientId: string,
    doctorId: string,
    params: QueryParams
  ): Promise<{ data: Appointment[]; totalItems: number }> {
    const { page = 1, limit = 10, status } = params;

    const matchStage: Record<string, unknown> = {
      patientId: new ObjectId(patientId),
      doctorId: new ObjectId(doctorId),
    };

    if (status !== undefined) {
      matchStage.status = status;
    }

    const pipeline: PipelineStage[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'prescriptions',
          localField: 'prescriptionId',
          foreignField: '_id',
          as: 'prescription',
        },
      },
      { $unwind: { path: '$prescription', preserveNullAndEmptyArrays: true } },
      {
        $facet: {
          data: [{ $sort: { createdAt: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit }],
          totalItems: [{ $count: 'count' }],
        },
      },
    ];

    const result = await this.model.aggregate(pipeline).exec();

    const data = result[0]?.data || [];
    const totalItems = result[0]?.totalItems[0]?.count || 0;

    return {
      data: data as Appointment[],
      totalItems,
    };
  }

  async findByDoctor(doctorId: string): Promise<Appointment[]> {
    const appointments = await this.model
      .find({ doctorId })
      .populate({ path: 'patientId', select: '-refreshToken -password' })
      .populate('doctorId', 'name')
      .exec();
    return appointments.map((appt) => appt.toObject() as Appointment);
  }

  async findByDoctorWithQuery(
    doctorId: string,
    params: QueryParams
  ): Promise<{ data: Appointment[]; totalItems: number }> {
    const { page = 1, limit = 5 } = params;

    const query = { doctorId };

    const appointments = await AppointmentModel.find(query)
      .populate('patientId', 'name profilePicture')
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const totalItems = await AppointmentModel.countDocuments(query).exec();

    return {
      data: appointments.map((appt) => appt.toObject() as Appointment),
      totalItems,
    };
  }

  async findAllWithQuery(params: QueryParams): Promise<{ data: Appointment[]; totalItems: number }> {
    const { search = '', page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status } = params;
    const query: FilterQuery<Appointment> = {};

    if (search) {
      const patientIds = await PatientModel.find({ name: { $regex: search, $options: 'i' } }, '_id').exec();
      const doctorIds = await DoctorModel.find({ name: { $regex: search, $options: 'i' } }, '_id').exec();
      query.$or = [
        { patientId: { $in: patientIds.map((p: { _id: string }) => p._id) } },
        { doctorId: { $in: doctorIds.map((d: { _id: string }) => d._id) } },
      ];
    }

    if (status !== undefined) {
      query.status = status;
    }

    const appointments = await this.model
      .find(query)
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .populate('prescriptionId')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const totalItems = await this.model.countDocuments(query).exec();

    return { data: appointments.map((appt) => appt.toObject() as Appointment), totalItems };
  }

  async completeAppointment(appointmentId: string, prescriptionId: string): Promise<Appointment> {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      throw new Error('Invalid appointment ID');
    }
    const appointment = await this.model
      .findById(appointmentId)
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .exec();

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (appointment.status !== 'pending') {
      throw new Error('Only pending appointments can be marked as completed');
    }

    appointment.status = AppointmentStatus.COMPLETED;
    appointment.prescriptionId = prescriptionId;
    await appointment.save();

    return appointment.toObject() as Appointment;
  }
}
