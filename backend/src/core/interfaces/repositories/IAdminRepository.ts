import { IBaseRepository } from './IBaseRepository';
import { Admin } from '../../entities/Admin';

export interface IAdminRepository extends IBaseRepository<Admin> {
  findByEmail(email: string): Promise<Admin | null>;
  getAdminDetails(id: string): Promise<Admin | null>;
}
