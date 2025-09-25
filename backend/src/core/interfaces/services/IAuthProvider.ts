import { UserRole } from '../../../types';
import { Patient } from '../../entities/Patient';
import { Doctor } from '../../entities/Doctor';
import { Admin } from '../../entities/Admin';
import { AuthProviderData } from '../../../types/authTypes';

export interface IAuthProvider {
  authenticate(role: UserRole, data: AuthProviderData): Promise<Patient | Doctor | Admin>;
}
