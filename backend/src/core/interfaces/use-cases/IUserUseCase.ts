import { UserRole } from '../../../types';
import { Admin } from '../../entities/Admin';
import { Doctor } from '../../entities/Doctor';
import { Patient } from '../../entities/Patient';

export interface IUserUseCase {
  getCurrentUser(userId: string, role: UserRole): Promise<Patient | Doctor | Admin | null>;
  getUser(userId: string): Promise<Patient | Doctor | Admin | null>;
}
