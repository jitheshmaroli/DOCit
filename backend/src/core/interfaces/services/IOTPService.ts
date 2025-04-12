export interface IOTPService {
  sendOTP(email: string): Promise<void>;
  verifyOTP(email: string, otp: string): Promise<boolean>;
  deleteOTP(email: string): Promise<void>;
}
