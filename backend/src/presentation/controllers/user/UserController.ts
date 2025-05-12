import { Response, NextFunction } from 'express';
import { AuthenticationError } from '../../../utils/errors';
import { Container } from '../../../infrastructure/di/container';
import { GetCurrentUserUseCase } from '../../../core/use-cases/user/GetCurrentUserUseCase';
import { CustomRequest } from '../../../types';

export class UserController {
  private getCurrentUserUseCase: GetCurrentUserUseCase;

  constructor(container: Container) {
    this.getCurrentUserUseCase = container.get('GetCurrentUserUseCase');
  }

  async getCurrentUser(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, role } = req.user || {};
      if (!id || !role) throw new AuthenticationError('User information missing');
      if (typeof id !== 'string') {
        console.warn('Invalid id type in req.user:', id);
        throw new AuthenticationError('Invalid user ID format');
      }
      const user = await this.getCurrentUserUseCase.execute(id, role);
      if (!user) throw new AuthenticationError('User not found');
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
}
