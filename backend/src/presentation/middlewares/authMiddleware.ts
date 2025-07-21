import { Response, NextFunction } from 'express';
import { ITokenService } from '../../core/interfaces/services/ITokenService';
import { AuthenticationError, ForbiddenError } from '../../utils/errors';
import { Container } from '../../infrastructure/di/container';
import { CustomRequest, UserRole } from '../../types';
import { UserUseCase } from '../../core/use-cases/UserUseCase';

export const authMiddleware = (container: Container) => {
  const tokenService: ITokenService = container.get('ITokenService');
  const userUseCase: UserUseCase = container.get('IUserUseCase');

  return async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return next(new AuthenticationError('No token provided'));
    }

    try {
      const decoded = tokenService.verifyAccessToken(accessToken);
      if (!decoded.userId || !decoded.role) {
        throw new AuthenticationError('Invalid token payload');
      }
      const role = decoded.role as UserRole;
      if (!Object.values(UserRole).includes(role)) {
        throw new AuthenticationError('Invalid user role');
      }

      const user = await userUseCase.getUser(decoded.userId);

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      if (user.isBlocked) {
        throw new ForbiddenError('User is blocked');
      }

      req.user = { id: decoded.userId, role };
      next();
    } catch (error) {
      next(error);
    }
  };
};
