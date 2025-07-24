import { env } from '../../config/env';
import { ITokenService } from '../../core/interfaces/services/ITokenService';
import * as jwt from 'jsonwebtoken';

export class TokenService implements ITokenService {
  private _ACCESS_TOKEN_SECRET: jwt.Secret;
  private _REFRESH_TOKEN_SECRET: jwt.Secret;
  private _ACCESS_TOKEN_EXPIRY = '15m';
  private _REFRESH_TOKEN_EXPIRY = '7d';

  constructor() {
    this._ACCESS_TOKEN_SECRET = env.ACCESS_TOKEN_SECRET;
    this._REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET;
    if (env.NODE_ENV === 'production' && (!env.ACCESS_TOKEN_SECRET || !env.REFRESH_TOKEN_SECRET)) {
      throw new Error('JWT secrets must be provided in production environment');
    }
  }

  generateAccessToken(userId: string, role: 'patient' | 'doctor' | 'admin'): string {
    return jwt.sign({ userId, role }, this._ACCESS_TOKEN_SECRET, {
      expiresIn: this._ACCESS_TOKEN_EXPIRY,
    } as jwt.SignOptions);
  }

  generateRefreshToken(userId: string, role: 'patient' | 'doctor' | 'admin'): string {
    return jwt.sign({ userId, role }, this._REFRESH_TOKEN_SECRET, {
      expiresIn: this._REFRESH_TOKEN_EXPIRY,
    } as jwt.SignOptions);
  }

  verifyAccessToken(token: string): { userId: string; role: string } {
    return jwt.verify(token, this._ACCESS_TOKEN_SECRET) as {
      userId: string;
      role: string;
    };
  }

  verifyRefreshToken(token: string): { userId: string; role: string } {
    return jwt.verify(token, this._REFRESH_TOKEN_SECRET) as {
      userId: string;
      role: string;
    };
  }
}
