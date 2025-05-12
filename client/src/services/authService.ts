import api from './api';
import {
  ForgotPasswordPayload,
  ResetPasswordPayload,
  SignUpPayload,
  VerifyOtpPayload,
} from '../types/authTypes';

export const signUpPatient = async (payload: SignUpPayload) => {
  const response = await api.post('/api/auth/patient/signup', payload);
  return response.data;
};

export const signUpDoctor = async (payload: SignUpPayload) => {
  const response = await api.post('/api/auth/doctor/signup', payload);
  return response.data;
};

export const verifySignUpOtp = async (payload: VerifyOtpPayload) => {
  const response = await api.post('/api/auth/verify-signup-otp', payload);
  return response.data;
};

export const login = async (payload: {
  email: string;
  password: string;
  role: string;
}) => {
  let endpoint = '';
  switch (payload.role) {
    case 'patient':
      endpoint = '/api/auth/patient/login';
      break;
    case 'doctor':
      endpoint = '/api/auth/doctor/login';
      break;
    case 'admin':
      endpoint = '/api/auth/admin/login';
      break;
    default:
      throw new Error('Invalid role');
  }
  const response = await api.post(endpoint, {
    email: payload.email,
    password: payload.password,
  });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/api/auth/logout');
  return response.data;
};

export const checkAuth = async () => {
  const response = await api.get('/api/user/me');
  console.log(response)
  return response.data;
};

export const resetPassword = async (payload: ResetPasswordPayload) => {
  const response = await api.post('/api/auth/reset-password', payload);
  return response.data;
};

export const forgotPassword = async (payload: ForgotPasswordPayload) => {
  const response = await api.post('/api/auth/forgot-password', payload);
  return response.data;
};

export const googleSignInPatient = async (token: string) => {
  const response = await api.post('/api/auth/patient/google-signin', { token });
  return response.data;
};

export const googleSignInDoctor = async (token: string) => {
  const response = await api.post('/api/auth/doctor/google-signin', { token });
  return response.data;
};

export const getUserProfile = async () => {
  const response = await api.get('/api/user/me');
  return response.data;
};

export const refreshToken = async () => {
  const response = await api.post('/api/auth/refresh-token');
  return response.data;
};