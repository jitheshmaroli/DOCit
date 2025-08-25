import { Admin } from '../../entities/Admin';
import { IBaseRepository } from './IBaseRepository';

export interface IAdminRepository extends IBaseRepository<Admin> {
  findByEmail(email: string): Promise<Admin | null>;
  getAdminDetails(adminId: string): Promise<Admin | null>;
}
