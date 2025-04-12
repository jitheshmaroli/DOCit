import { IAdminRepository } from '../../core/interfaces/repositories/IAdminRepository';
import { Admin } from '../../core/entities/Admin';
import { AdminModel } from '../database/models/AdminModel';

export class AdminRepository implements IAdminRepository {
  async create(admin: Admin): Promise<Admin> {
    const newAdmin = new AdminModel(admin);
    return newAdmin.save();
  }

  async findByEmail(email: string): Promise<Admin | null> {
    return AdminModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<Admin | null> {
    return AdminModel.findById(id).exec();
  }

  async update(id: string, admin: Partial<Admin>): Promise<Admin | null> {
    return AdminModel.findByIdAndUpdate(id, admin, { new: true }).exec();
  }

  async delete(id: string): Promise<void> {
    await AdminModel.findByIdAndDelete(id).exec();
  }

  async getAdminDetails(id: string): Promise<Admin | null> {
    const admin = await AdminModel.findById(id).select('-password').exec();
    return admin ? (admin.toObject() as Admin) : null;
  }
}
