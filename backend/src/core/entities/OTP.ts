export interface OTP {
  _id?: string;
  email: string;
  otp: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
