import AuthMiddleware from '../../presentation/middlewares/authMiddleware';
import RoleMiddleware from '../../presentation/middlewares/roleMiddleware';
import ErrorHandler from '../../presentation/middlewares/errorMiddleware';
import { tokenService } from './services';
import { UserRole } from '../../types';

const createMiddlewares = () => ({
  authMiddleware: new AuthMiddleware(tokenService),
  chatRoleMiddleware: new RoleMiddleware([UserRole.Doctor, UserRole.Patient]),
  doctorRoleMiddleware: new RoleMiddleware([UserRole.Doctor]),
  patientRoleMiddleware: new RoleMiddleware([UserRole.Patient]),
  adminRoleMiddleware: new RoleMiddleware([UserRole.Admin]),
  errorHandler: new ErrorHandler(),
});

export default createMiddlewares;
