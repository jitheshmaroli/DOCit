import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../types';

interface AuthenticatedRequest extends Request {
  user?: {
    role: UserRole;
  };
}

export default class RoleMiddleware {
  constructor(private roles: Array<UserRole>) {
    this.exec = this.exec.bind(this);
  }

  exec(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const userRole = req.user?.role;
    if (!userRole || !this.roles.includes(userRole)) {
      res.status(403).json({ message: 'Forbidden: Insufficient role permissions' });
      return;
    }
    next();
  }
}
