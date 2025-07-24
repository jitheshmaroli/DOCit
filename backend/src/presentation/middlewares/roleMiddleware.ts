import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../types';

interface AuthenticatedRequest extends Request {
  user?: {
    role: UserRole;
  };
}

export const roleMiddleware = (roles: Array<UserRole>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({ message: 'Forbidden: Insufficient role permissions' });
      return;
    }
    next();
  };
};
