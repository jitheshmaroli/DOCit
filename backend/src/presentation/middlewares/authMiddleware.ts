import { Request, Response, NextFunction } from 'express';
import { ITokenService } from '../../core/interfaces/services/ITokenService';
import { AuthenticationError } from '../../utils/errors';
import { Container } from '../../infrastructure/di/container';

export const authMiddleware = (container: Container) => {
  const tokenService: ITokenService = container.get('ITokenService');

  return (req: Request, res: Response, next: NextFunction): void => {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return next(new AuthenticationError('No token provided'));
    }

    try {
      const decoded = tokenService.verifyAccessToken(accessToken);
      if (!decoded.userId || !decoded.role) {
        throw new AuthenticationError('Invalid token payload');
      }
      (req as any).user = { id: decoded.userId, role: decoded.role };
      next();
    } catch (error) {
      next(error);
    }
  };
};
