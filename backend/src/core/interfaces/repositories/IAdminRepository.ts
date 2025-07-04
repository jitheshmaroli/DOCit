import { IBaseRepository } from './IBaseRepository';
import { Admin } from '../../entities/Admin';

export interface IAdminRepository extends IBaseRepository<Admin> {
  findByEmail(email: string): Promise<Admin | null>;
  getAdminDetails(adminId: string): Promise<Admin | null>;
}
