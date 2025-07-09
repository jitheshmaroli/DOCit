/* eslint-disable @typescript-eslint/no-explicit-any */
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

interface AuthHook {
  user: User | null;
  loading: boolean;
  error: string | null;
  otpSent: boolean;
  signUpPatient: (payload: SignUpPayload) => Promise<any>;
  signUpDoctor: (payload: SignUpPayload) => Promise<any>;
  verifySignUpOtp: (payload: VerifyOtpPayload) => Promise<any>;
  login: (
    payload: LoginPayload,
    options?: { onSuccess?: () => void; onError?: (error: string) => void }
  ) => Promise<any>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<any>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<any>;
  logout: () => Promise<any>;
  googleSignInPatient: (token: string) => Promise<any>;
  googleSignInDoctor: (token: string) => Promise<any>;
  checkAuth: (
    expectedRole: 'patient' | 'doctor' | 'admin' | undefined
  ) => Promise<any>;
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

    login: async (
      payload: LoginPayload,
      options?: { onSuccess?: () => void; onError?: (error: string) => void }
    ) => {
      const result = await dispatch(loginThunk(payload));
      if (loginThunk.fulfilled.match(result)) {
        options?.onSuccess?.();
      } else {
        options?.onError?.(result.payload as string);
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
