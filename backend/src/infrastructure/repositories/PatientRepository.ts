import { IPatientRepository } from '../../core/interfaces/repositories/IPatientRepository';
import { Patient } from '../../core/entities/Patient';
import { PatientModel } from '../database/models/PatientModel';
import { NotFoundError } from '../../utils/errors';
import { QueryParams } from '../../types/authTypes';
import { QueryBuilder } from '../../utils/queryBuilder';

export class PatientRepository implements IPatientRepository {
  async create(patient: Patient): Promise<Patient> {
    const newPatient = new PatientModel(patient);
    const savedPatient = await newPatient.save();
    return savedPatient.toObject() as Patient;
  }

  async findByEmail(email: string): Promise<Patient | null> {
    const patient = await PatientModel.findOne({ email, isBlocked: false }).exec();
    return patient ? (patient.toObject() as Patient) : null;
  }

  async findById(id: string): Promise<Patient | null> {
    const patient = await PatientModel.findById(id).exec();
    return patient ? (patient.toObject() as Patient) : null;
  }

  async update(id: string, updates: Partial<Patient>): Promise<Patient | null> {
    const patient = await PatientModel.findByIdAndUpdate(id, updates, {
      new: true,
    }).exec();
    return patient ? (patient.toObject() as Patient) : null;
  }

  async delete(id: string): Promise<void> {
    await PatientModel.findByIdAndDelete(id).exec();
  }

  async findAllWithQuery(
    params: QueryParams
  ): Promise<{ data: Patient[]; totalItems: number }> {
    const query = QueryBuilder.buildQuery(params);
    const sort = QueryBuilder.buildSort(params);
    const { page, limit } = QueryBuilder.validateParams(params);

    const patients = await PatientModel.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const totalItems = await PatientModel.countDocuments(query).exec();

    return { data: patients, totalItems };
  }

  async getPateintDetails(id: string): Promise<Patient | null> {
    const patient = await PatientModel.findById(id).select('-password').exec();
    return patient ? (patient.toObject() as Patient) : null;
  }

  async updateSubscriptionStatus(
    patientId: string,
    isSubscribed: boolean
  ): Promise<Patient | null> {
    const patient = await PatientModel.findByIdAndUpdate(
      patientId,
      { isSubscribed },
      { new: true }
    ).exec();
    return patient ? (patient.toObject() as Patient) : null;
  }
}
