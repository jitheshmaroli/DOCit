import { env } from '../../config/env';
import { ITokenService } from '../../core/interfaces/services/ITokenService';
import * as jwt from 'jsonwebtoken';

export class TokenService implements ITokenService {
  private ACCESS_TOKEN_SECRET: jwt.Secret;
  private REFRESH_TOKEN_SECRET: jwt.Secret;
  private ACCESS_TOKEN_EXPIRY = '15m';
  private REFRESH_TOKEN_EXPIRY = '7d';

  constructor() {
    this.ACCESS_TOKEN_SECRET = env.ACCESS_TOKEN_SECRET;
    this.REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET;
    if (
      env.NODE_ENV === 'production' &&
      (!env.ACCESS_TOKEN_SECRET || !env.REFRESH_TOKEN_SECRET)
    ) {
      throw new Error('JWT secrets must be provided in production environment');
    }
  }

  generateAccessToken(
    userId: string,
    role: 'patient' | 'doctor' | 'admin'
  ): string {
    return jwt.sign({ userId, role }, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    } as jwt.SignOptions);
  }

  generateRefreshToken(
    userId: string,
    role: 'patient' | 'doctor' | 'admin'
  ): string {
    return jwt.sign({ userId, role }, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    } as jwt.SignOptions);
  }

  verifyAccessToken(token: string): { userId: string; role: string } {
    return jwt.verify(token, this.ACCESS_TOKEN_SECRET) as {
      userId: string;
      role: string;
    };
  }

  verifyRefreshToken(token: string): { userId: string; role: string } {
    return jwt.verify(token, this.REFRESH_TOKEN_SECRET) as {
      userId: string;
      role: string;
    };
  }
}
