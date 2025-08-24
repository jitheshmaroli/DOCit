import { AdminDTO } from '../AdminDTOs';
import { IBaseRepository } from './IBaseRepository';

export interface IAdminRepository extends IBaseRepository<AdminDTO> {
  findByEmail(email: string): Promise<AdminDTO | null>;
  getAdminDetails(adminId: string): Promise<AdminDTO | null>;
}
