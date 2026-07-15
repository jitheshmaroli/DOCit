import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import {
  signUpPatientThunk,
  signUpDoctorThunk,
  verifySignUpOtpThunk,
  logoutThunk,
  googleSignInPatientThunk,
  googleSignInDoctorThunk,
  loginThunk,
  forgotPasswordThunk,
  resetPasswordThunk,
  checkAuthThunk,
  resendSignupOTPThunk,
} from '../redux/thunks/authThunks';
import {
  resetAuthState,
  resetOtpState,
  setError,
} from '../redux/slices/authSlice';
import {
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  SignUpPayload,
  User,
  VerifyOtpPayload,
} from '../types/authTypes';
import { SerializedError } from '@reduxjs/toolkit';

type ThunkResult<T = unknown> =
  | ReturnType<typeof loginThunk.fulfilled>
  | ReturnType<typeof loginThunk.rejected>
  | {
      type: string;
      payload?: T;
      error?: SerializedError | null;
    };
interface AuthHook {
  user: User | null;
  loading: boolean;
  error: string | null;
  otpSent: boolean;
  signUpPatient: (payload: SignUpPayload) => Promise<ThunkResult>;
  signUpDoctor: (payload: SignUpPayload) => Promise<ThunkResult>;
  verifySignUpOtp: (payload: VerifyOtpPayload) => Promise<ThunkResult>;
  resendSignupOTP: (email: string, role: string) => Promise<ThunkResult>;
  login: (
    payload: LoginPayload,
    options?: { onSuccess?: () => void; onError?: (error: string) => void }
  ) => Promise<ThunkResult>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<ThunkResult>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<ThunkResult>;
  logout: () => Promise<ThunkResult>;
  googleSignInPatient: (token: string) => Promise<ThunkResult>;
  googleSignInDoctor: (token: string) => Promise<ThunkResult>;
  checkAuth: (
    expectedRole: 'patient' | 'doctor' | 'admin' | undefined
  ) => Promise<ThunkResult>;
  resetAuthState: () => void;
  resetOtpState: () => void;
  clearError: () => void;
}

const useAuth = (): AuthHook => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading, error, otpSent } = useSelector(
    (state: RootState) => state.auth
  );

  return {
    user,
    loading,
    error,
    otpSent,

    signUpPatient: async (payload: SignUpPayload) => {
      const result = await dispatch(signUpPatientThunk(payload));
      return result;
    },

    signUpDoctor: async (payload: SignUpPayload) => {
      const result = await dispatch(signUpDoctorThunk(payload));
      return result;
    },

    verifySignUpOtp: async (payload: VerifyOtpPayload) => {
      const result = await dispatch(verifySignUpOtpThunk(payload));
      return result;
    },
    resendSignupOTP: async (email: string, role: string) => {
      const result = await dispatch(resendSignupOTPThunk({ email, role }));
      return result;
    },

    login: async (
      payload: LoginPayload,
      options?: { onSuccess?: () => void; onError?: (error: string) => void }
    ) => {
      const result = await dispatch(loginThunk(payload));
      if (loginThunk.fulfilled.match(result)) {
        options?.onSuccess?.();
      } else if (loginThunk.rejected.match(result)) {
        const errorMessage =
          typeof result.payload === 'string'
            ? result.payload
            : result.error?.message || 'Login failed';
        options?.onError?.(errorMessage);
      }
      return result;
    },

    forgotPassword: async (payload: ForgotPasswordPayload) => {
      const result = await dispatch(forgotPasswordThunk(payload));
      return result;
    },

    resetPassword: async (payload: ResetPasswordPayload) => {
      const result = await dispatch(resetPasswordThunk(payload));
      return result;
    },

    logout: async () => {
      const result = await dispatch(logoutThunk());
      return result;
    },

    googleSignInPatient: async (token: string) => {
      const result = await dispatch(googleSignInPatientThunk(token));
      return result;
    },

    googleSignInDoctor: async (token: string) => {
      const result = await dispatch(googleSignInDoctorThunk(token));
      return result;
    },

    checkAuth: async (
      expectedRole: 'patient' | 'doctor' | 'admin' | undefined
    ) => {
      const result = await dispatch(checkAuthThunk(expectedRole));
      return result;
    },

    resetAuthState: () => dispatch(resetAuthState()),
    resetOtpState: () => dispatch(resetOtpState()),
    clearError: () => dispatch(setError('')),
  };
};

export default useAuth;
