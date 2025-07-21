import { Response, NextFunction } from 'express';
import { AuthenticationError } from '../../../utils/errors';
import { Container } from '../../../infrastructure/di/container';
import { IUserUseCase } from '../../../core/interfaces/use-cases/IUserUseCase';
import { CustomRequest } from '../../../types';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';

export class UserController {
  private userUseCase: IUserUseCase;

  constructor(container: Container) {
    this.userUseCase = container.get<IUserUseCase>('IUserUseCase');
  }

  async getCurrentUser(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, role } = req.user || {};
      if (!id || !role) throw new AuthenticationError(ResponseMessages.BAD_REQUEST);
      if (typeof id !== 'string') {
        console.warn('Invalid id type in req.user:', id);
        throw new AuthenticationError(ResponseMessages.BAD_REQUEST);
      }
      const user = await this.userUseCase.getCurrentUser(id, role);
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
      const user = await this.userUseCase.getUser(userId);
      if (!user) throw new AuthenticationError(ResponseMessages.USER_NOT_FOUND);
      res.status(HttpStatusCode.OK).json(user);
    } catch (error) {
      next(error);
    }
  }
}
