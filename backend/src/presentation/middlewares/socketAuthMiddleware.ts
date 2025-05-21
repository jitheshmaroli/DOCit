import { Socket } from 'socket.io';
import { ITokenService } from '../../core/interfaces/services/ITokenService';
import { AuthenticationError } from '../../utils/errors';

export const socketAuthMiddleware = (tokenService: ITokenService) => {
  return async (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new AuthenticationError('No token provided'));
    }

    try {
      const decoded = tokenService.verifyAccessToken(token);
      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      console.log('auth socket', socket.data);
      next();
    } catch {
      next(new AuthenticationError('Invalid token'));
    }
  };
};
