export interface ITokenService {
  generateAccessToken(userId: string, role: string): string;
  generateRefreshToken(userId: string, role: string): string;
  verifyAccessToken(token: string): { userId: string; role: string };
  verifyRefreshToken(token: string): { userId: string; role: string };
}
