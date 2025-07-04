import { IAdminRepository } from '../../core/interfaces/repositories/IAdminRepository';
import { Admin } from '../../core/entities/Admin';
import { BaseRepository } from './BaseRepository';
import { AdminModel } from '../database/models/AdminModel';
import mongoose from 'mongoose';

export class AdminRepository extends BaseRepository<Admin> implements IAdminRepository {
  constructor() {
    super(AdminModel);
  }

  async findByEmail(email: string): Promise<Admin | null> {
    const admin = await this.model.findOne({ email }).exec();
    return admin ? (admin.toObject() as Admin) : null;
  }

  async getAdminDetails(adminId: string): Promise<Admin | null> {
    if (!mongoose.Types.ObjectId.isValid(adminId)) return null;
    const admin = await this.model.findById(adminId).select('-password').exec();
    return admin ? (admin.toObject() as Admin) : null;
  }
}
