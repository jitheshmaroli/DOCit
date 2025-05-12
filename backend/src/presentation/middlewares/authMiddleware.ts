import { Response, NextFunction } from 'express';
import { ITokenService } from '../../core/interfaces/services/ITokenService';
import { AuthenticationError } from '../../utils/errors';
import { Container } from '../../infrastructure/di/container';
import { CustomRequest, UserRole } from '../../types';

export const authMiddleware = (container: Container) => {
  const tokenService: ITokenService = container.get('ITokenService');

  return (req: CustomRequest, res: Response, next: NextFunction): void => {
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
      req.user = { id: decoded.userId, role };
      next();
    } catch (error) {
      next(error);
    }
  };
};
