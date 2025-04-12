import { IPatientRepository } from '../../core/interfaces/repositories/IPatientRepository';
import { Patient } from '../../core/entities/Patient';
import { PatientModel } from '../database/models/PatientModel';

export class PatientRepository implements IPatientRepository {
  async create(patient: Patient): Promise<Patient> {
    const newPatient = new PatientModel(patient);
    const savedPatient = await newPatient.save();
    return savedPatient.toObject() as Patient;
  }

  async findByEmail(email: string): Promise<Patient | null> {
    const patient = await PatientModel.findOne({ email }).exec();
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

  async list(): Promise<Patient[]> {
    const patients = await PatientModel.find().exec();
    return patients.map(p => p.toObject() as Patient);
  }

  async getPateintDetails(id: string): Promise<Patient | null> {
    const patient = await PatientModel.findById(id).select('-password').exec();
    return patient ? (patient.toObject() as Patient) : null;
  }
}
