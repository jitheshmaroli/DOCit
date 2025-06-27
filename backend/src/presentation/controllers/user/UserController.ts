import { Response, NextFunction } from 'express';
import { AuthenticationError } from '../../../utils/errors';
import { Container } from '../../../infrastructure/di/container';
import { GetCurrentUserUseCase } from '../../../core/use-cases/user/GetCurrentUserUseCase';
import { CustomRequest } from '../../../types';
import { GetUserUseCase } from '../../../core/use-cases/user/GetUserUseCase';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';

export class UserController {
  private getCurrentUserUseCase: GetCurrentUserUseCase;
  private getUserUseCase: GetUserUseCase;

  constructor(container: Container) {
    this.getCurrentUserUseCase = container.get('GetCurrentUserUseCase');
    this.getUserUseCase = container.get('GetUserUseCase');
  }

  async getCurrentUser(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, role } = req.user || {};
      if (!id || !role) throw new AuthenticationError(ResponseMessages.BAD_REQUEST);
      if (typeof id !== 'string') {
        console.warn('Invalid id type in req.user:', id);
        throw new AuthenticationError(ResponseMessages.BAD_REQUEST);
      }
      const user = await this.getCurrentUserUseCase.execute(id, role);
      if (!user) throw new AuthenticationError(ResponseMessages.USER_NOT_FOUND);
      res.status(HttpStatusCode.OK).json(user);
    } catch (error) {
      next(error);
    }
  }

  async getUser(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      if (!userId || typeof userId !== 'string') {
        throw new AuthenticationError(ResponseMessages.BAD_REQUEST);
      }
      const user = await this.getUserUseCase.execute(userId);
      if (!user) throw new AuthenticationError(ResponseMessages.USER_NOT_FOUND);
      res.status(HttpStatusCode.OK).json(user);
    } catch (error) {
      next(error);
    }
  }
}
