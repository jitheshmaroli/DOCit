import mongoose, { FilterQuery } from 'mongoose';
import { IAppointmentRepository } from '../../core/interfaces/repositories/IAppointmentRepository';
import { Appointment } from '../../core/entities/Appointment';
import { QueryParams } from '../../types/authTypes';
import { DateUtils } from '../../utils/DateUtils';
import { AppointmentModel } from '../database/models/AppointmentModel';
import { PatientModel } from '../database/models/PatientModel';
import { DoctorModel } from '../database/models/DoctorModel';
import { Prescription } from '../../core/entities/Prescription';
import { PrescriptionModel } from '../database/models/PrescriptionModel';

export class AppointmentRepository implements IAppointmentRepository {
  private model = AppointmentModel;

  async create(appointment: Appointment): Promise<Appointment> {
    const newAppointment = new this.model({
      ...appointment,
      date: DateUtils.startOfDayUTC(appointment.date),
    });
    const savedAppointment = await newAppointment.save();
    return savedAppointment.toObject() as Appointment;
  }

  async findById(appointmentId: string): Promise<Appointment | null> {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) return null;
    const appointment = await this.model
      .findById(appointmentId)
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .populate('prescriptionId')
      .exec();
    return appointment ? (appointment.toObject() as Appointment) : null;
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
      .populate('doctorId', 'name')
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

  async update(appointmentId: string, updates: Partial<Appointment>): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) return;
    await this.model.findByIdAndUpdate(appointmentId, updates).exec();
  }

  async deleteById(appointmentId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) return;
    await this.model.findByIdAndDelete(appointmentId).exec();
  }

  async findByPatient(patientId: string): Promise<Appointment[]> {
    const appointments = await this.model
      .find({ patientId })
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .exec();
    return appointments.map((appt) => appt.toObject() as Appointment);
  }

  async findByPatientAndDoctorWithQuery(
    patientId: string,
    doctorId: string,
    params: QueryParams
  ): Promise<{ data: Appointment[]; totalItems: number }> {
    const { page = 1, limit = 10, status } = params;
    const query: FilterQuery<Appointment> = {
      patientId,
      doctorId,
    };

    if (status !== undefined) {
      query.status = status;
    }

    const appointments = await this.model
      .find(query)
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const totalItems = await this.model.countDocuments(query).exec();

    return {
      data: appointments.map((appt) => appt.toObject() as Appointment),
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
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const totalItems = await this.model.countDocuments(query).exec();

    return { data: appointments.map((appt) => appt.toObject() as Appointment), totalItems };
  }

  async completeAppointmentAndCreatePrescription(
    appointmentId: string,
    prescription: Omit<Prescription, '_id' | 'appointmentId' | 'patientId' | 'doctorId' | 'createdAt' | 'updatedAt'>
  ): Promise<Appointment> {
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

    const newPrescription = new PrescriptionModel({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      ...prescription,
    });

    const savedPrescription = await newPrescription.save();

    appointment.status = 'completed';
    appointment.prescriptionId = savedPrescription._id.toString();
    await appointment.save();

    return appointment.toObject() as Appointment;
  }
}
