import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    role: 'patient' | 'doctor' | 'admin';
  };
}

export const roleMiddleware = (
  roles: Array<'patient' | 'doctor' | 'admin'>
) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      res
        .status(403)
        .json({ message: 'Forbidden: Insufficient role permissions' });
      return;
    }
    next();
  };
};
