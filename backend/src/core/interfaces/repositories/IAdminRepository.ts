import { Admin } from '../../entities/Admin';

export interface IAdminRepository {
  create(admin: Admin): Promise<Admin>;
  findByEmail(email: string): Promise<Admin | null>;
  findById(id: string): Promise<Admin | null>;
  update(id: string, admin: Partial<Admin>): Promise<Admin | null>;
  delete(id: string): Promise<void>;
  getAdminDetails(id: string): Promise<Admin | null>;
}
