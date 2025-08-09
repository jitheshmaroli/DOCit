import api from './api';
import {
  ForgotPasswordPayload,
  ResetPasswordPayload,
  SignUpPayload,
  VerifyOtpPayload,
} from '../types/authTypes';
import { ROUTES } from '../constants/routeConstants';

export const signUpPatient = async (payload: SignUpPayload) => {
  const response = await api.post(ROUTES.API.AUTH.PATIENT_SIGNUP, payload);
  return response.data;
};

export const signUpDoctor = async (payload: SignUpPayload) => {
  const response = await api.post(ROUTES.API.AUTH.DOCTOR_SIGNUP, payload);
  return response.data;
};

export const resendSignupOTP = async (payload: {
  email: string;
  role: string;
}) => {
  const response = await api.post(ROUTES.API.AUTH.RESEND_SIGNUP_OTP, payload);
  return response.data;
};

export const verifySignUpOtp = async (payload: VerifyOtpPayload) => {
  const response = await api.post(ROUTES.API.AUTH.VERIFY_SIGNUP_OTP, payload);
  return response.data;
};

export const login = async (payload: {
  email: string;
  password: string;
  role: string;
}) => {
  const roleEndpoints: Record<string, string> = {
    patient: ROUTES.API.AUTH.PATIENT_LOGIN,
    doctor: ROUTES.API.AUTH.DOCTOR_LOGIN,
    admin: ROUTES.API.AUTH.ADMIN_LOGIN,
  };

  const endpoint = roleEndpoints[payload.role];
  if (!endpoint) {
    throw new Error('Invalid role');
  }

  const response = await api.post(endpoint, {
    email: payload.email,
    password: payload.password,
  });
  return response.data;
};

export const logout = async () => {
  const response = await api.post(ROUTES.API.AUTH.LOGOUT);
  return response.data;
};

export const checkAuth = async () => {
  const response = await api.get(ROUTES.API.AUTH.USER_PROFILE);
  return response.data;
};

export const resetPassword = async (payload: ResetPasswordPayload) => {
  const response = await api.post(ROUTES.API.AUTH.RESET_PASSWORD, payload);
  return response.data;
};

export const forgotPassword = async (payload: ForgotPasswordPayload) => {
  const response = await api.post(ROUTES.API.AUTH.FORGOT_PASSWORD, payload);
  return response.data;
};

export const googleSignInPatient = async (token: string) => {
  const response = await api.post(ROUTES.API.AUTH.GOOGLE_SIGNIN_PATIENT, {
    token,
  });
  return response.data;
};

export const googleSignInDoctor = async (token: string) => {
  const response = await api.post(ROUTES.API.AUTH.GOOGLE_SIGNIN_DOCTOR, {
    token,
  });
  return response.data;
};

export const getUserProfile = async () => {
  const response = await api.get(ROUTES.API.AUTH.USER_PROFILE);
  return response.data;
};

export const refreshToken = async () => {
  const response = await api.post(ROUTES.API.AUTH.REFRESH_TOKEN);
  return response.data;
};
