import { Response, NextFunction } from 'express';
import { AuthenticationError } from '../../../utils/errors';
import { IUserUseCase } from '../../../core/interfaces/use-cases/IUserUseCase';
import { CustomRequest, UserRole } from '../../../types';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';

export class UserController {
  constructor(private _userUseCase: IUserUseCase) {}

  async getCurrentUser(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      if (!userId || !role || !Object.values(UserRole).includes(role)) {
        throw new AuthenticationError(ResponseMessages.BAD_REQUEST);
      }
      if (typeof userId !== 'string') {
        throw new AuthenticationError(ResponseMessages.BAD_REQUEST);
      }
      const user = await this._userUseCase.getCurrentUser(userId, role as UserRole);
      if (!user) {
        throw new AuthenticationError(ResponseMessages.USER_NOT_FOUND);
      }
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
      const user = await this._userUseCase.getUser(userId);
      if (!user) {
        throw new AuthenticationError(ResponseMessages.USER_NOT_FOUND);
      }
      res.status(HttpStatusCode.OK).json(user);
    } catch (error) {
      next(error);
    }
  }
}
