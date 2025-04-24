import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { Doctor } from '../../core/entities/Doctor';
import { DoctorModel } from '../database/models/DoctorModel';

export class DoctorRepository implements IDoctorRepository {
  async create(doctor: Doctor): Promise<Doctor> {
    const newDoctor = new DoctorModel(doctor);
    return newDoctor.save();
  }

  async findByEmail(email: string): Promise<Doctor | null> {
    return DoctorModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<Doctor | null> {
    return DoctorModel.findById(id).exec();
  }

  async update(id: string, updates: Partial<Doctor>): Promise<Doctor | null> {
    return DoctorModel.findByIdAndUpdate(id, updates, { new: true }).exec();
  }

  async findByCriteria(criteria: Partial<Doctor>): Promise<Doctor[]> {
    return DoctorModel.find(criteria).exec();
  }

  async delete(id: string): Promise<void> {
    await DoctorModel.findByIdAndDelete(id).exec();
  }

  async list(): Promise<Doctor[]> {
    return DoctorModel.find().exec();
  }

  async listVerified(): Promise<Doctor[]> {
    return DoctorModel.find({ isVerified: true, isBlocked: false }).exec();
  }

  async getDoctorDetails(id: string): Promise<Doctor | null> {
    const doctor = await DoctorModel.findById(id).select('-password').exec();
    return doctor ? (doctor.toObject() as Doctor) : null;
  }

  async findVerified(): Promise<any[]> {
    return await DoctorModel.find({ isVerified: true, isBlocked: false }).exec();
  }
}
