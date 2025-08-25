import { UserRole } from '../../../types';
import { GetUserResponseDTO } from '../../../application/dtos/UserDTOs';

export interface IUserUseCase {
  getCurrentUser(userId: string, role: UserRole): Promise<GetUserResponseDTO | null>;
  getUser(userId: string): Promise<GetUserResponseDTO | null>;
}
