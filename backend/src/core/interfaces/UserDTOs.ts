import { UserRole } from '../../types';

export interface GetUserResponseDTO {
  _id: string;
  email: string;
  name?: string;
  role: UserRole;
}
