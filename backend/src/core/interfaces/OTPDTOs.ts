export interface SendOTPRequestDTO {
  email: string;
}

export interface VerifyOTPRequestDTO {
  email: string;
  otp: string;
}
