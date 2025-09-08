/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  signUpPatient,
  signUpDoctor,
  verifySignUpOtp,
  login,
  logout,
  checkAuth,
  resetPassword,
  forgotPassword,
  googleSignInPatient,
  googleSignInDoctor,
  getUserProfile,
  refreshToken,
  resendSignupOTP,
} from '../../services/authService';
import {
  clearUser,
  otpSentSuccess,
  setError,
  setInitialAuthCheckComplete,
  setLoading,
  setSignupData,
  setUser,
} from '../slices/authSlice';
import {
  ForgotPasswordPayload,
  ResetPasswordPayload,
  SignUpPayload,
  User,
  VerifyOtpPayload,
} from '../../types/authTypes';

const handleError = (error: any, thunkAPI: any) => {
  const statusCode = error.response?.status || 500;
  const data = error.response?.data as { message?: string; error?: string };
  const message = data?.message || error.message || 'An error occurred';
  const errorName = data?.error || '';

  if (
    statusCode === 403 &&
    errorName === 'ForbiddenError' &&
    message === 'User is blocked'
  ) {
    thunkAPI.dispatch(clearUser());
    window.dispatchEvent(new Event('auth:logout'));
    return thunkAPI.rejectWithValue({ message, statusCode });
  }

  if (statusCode === 401 && error.config?.url.includes('/api/user/me')) {
    thunkAPI.dispatch(setInitialAuthCheckComplete());
    return thunkAPI.rejectWithValue(null);
  }

  thunkAPI.dispatch(setError(message));
  return thunkAPI.rejectWithValue({ message, statusCode });
};

export const signUpPatientThunk = createAsyncThunk(
  'auth/signUp',
  async (payload: SignUpPayload, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      const response = await signUpPatient(payload);

      if (response.message === 'OTP sent to your email') {
        thunkAPI.dispatch(otpSentSuccess());
        thunkAPI.dispatch(setSignupData(payload));
        return { email: payload.email, _id: response._id };
      }

      throw new Error('Unexpected response from server');
    } catch (error) {
      return handleError(error, thunkAPI);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);

export const signUpDoctorThunk = createAsyncThunk(
  'auth/signUpDoctor',
  async (payload: SignUpPayload, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      const response = await signUpDoctor(payload);

      if (response.message === 'OTP sent to your email') {
        thunkAPI.dispatch(otpSentSuccess());
        return { email: payload.email, _id: response._id };
      }

      throw new Error('Unexpected response from server');
    } catch (error) {
      return handleError(error, thunkAPI);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);

export const resendSignupOTPThunk = createAsyncThunk(
  'auth/resendSignupOTP',
  async (payload: { email: string; role: string }, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      const response = await resendSignupOTP(payload);

      if (response.message === 'OTP sent to your email') {
        thunkAPI.dispatch(otpSentSuccess());
        return { email: payload.email };
      }

      throw new Error('Unexpected response from server');
    } catch (error) {
      return handleError(error, thunkAPI);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);

export const verifySignUpOtpThunk = createAsyncThunk(
  'auth/verifySignUpOtp',
  async (payload: VerifyOtpPayload, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      const response = await verifySignUpOtp(payload);

      const user: User = {
        _id: response._id,
        email: response.email,
        name: response.name,
        role: payload.role as 'patient' | 'doctor',
      };

      thunkAPI.dispatch(setUser(user));
      return user;
    } catch (error) {
      return handleError(error, thunkAPI);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (
    payload: { email: string; password: string; role: string },
    thunkAPI
  ) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      const response = await login(payload);
      if (response.message === 'Logged in successfully') {
        try {
          const userResponse = await getUserProfile();
          const user: User = {
            _id: userResponse._id,
            email: userResponse.email,
            name: userResponse.name,
            role: userResponse.role || payload.role,
            profilePicture: userResponse.profilePicture,
          };

          thunkAPI.dispatch(setUser(user));
          return user;
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          return thunkAPI.rejectWithValue({
            message: 'Logged in but failed to fetch profile',
            statusCode: 200,
          });
        }
      }

      return thunkAPI.rejectWithValue({
        message: 'Unexpected response from server',
        statusCode: response.status,
      });
    } catch (error) {
      return handleError(error, thunkAPI);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);

export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      await logout();
      thunkAPI.dispatch(clearUser());
    } catch (error) {
      return handleError(error, thunkAPI);
    } finally {
      thunkAPI.dispatch(clearUser());
      thunkAPI.dispatch(setLoading(false));
    }
  }
);

export const checkAuthThunk = createAsyncThunk(
  'auth/checkAuth',
  async (
    expectedRole: 'patient' | 'doctor' | 'admin' | undefined,
    thunkAPI
  ) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      const response = await checkAuth();

      const user: User = {
        _id: response._id,
        name: response.name,
        email: response.email,
        role: response.role || expectedRole,
        phone: response.phone,
        profilePicture: response.profilePicture,
      };

      thunkAPI.dispatch(setUser(user));
      return user;
    } catch (error: any) {
      if (error.status === 401) {
        try {
          await thunkAPI.dispatch(refreshTokenThunk()).unwrap();
          const response = await checkAuth();
          const user: User = {
            _id: response._id,
            name: response.name,
            email: response.email,
            role: response.role || expectedRole,
            phone: response.phone,
          };
          thunkAPI.dispatch(setUser(user));
          return user;
        } catch (refreshError) {
          console.error('Refresh token failed in checkAuth:', refreshError);
          thunkAPI.dispatch(clearUser());
          return handleError(refreshError, thunkAPI);
        }
      }
      thunkAPI.dispatch(clearUser());
      return handleError(error, thunkAPI);
    } finally {
      thunkAPI.dispatch(setLoading(false));
      thunkAPI.dispatch(setInitialAuthCheckComplete());
    }
  }
);

export const resetPasswordThunk = createAsyncThunk(
  'auth/resetPassword',
  async (payload: ResetPasswordPayload, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      const response = await resetPassword(payload);

      if (response.message !== 'Password reset successfully') {
        throw new Error(response.message || 'Failed to reset password');
      }

      return response;
    } catch (error) {
      return handleError(error, thunkAPI);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);

export const forgotPasswordThunk = createAsyncThunk(
  'auth/forgotPassword',
  async (payload: ForgotPasswordPayload, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      const response = await forgotPassword(payload);
      return response;
    } catch (error) {
      return handleError(error, thunkAPI);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);

export const googleSignInPatientThunk = createAsyncThunk(
  'auth/googleSignInPatient',
  async (token: string, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      const response = await googleSignInPatient(token);

      if (response.message === 'Logged in successfully') {
        const userResponse = await getUserProfile();
        const user: User = {
          _id: userResponse._id,
          role: 'patient',
          email: userResponse.email,
          name: userResponse.name,
        };
        thunkAPI.dispatch(setUser(user));
        return user;
      }

      throw new Error('Unexpected response from server');
    } catch (error) {
      return handleError(error, thunkAPI);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);

export const googleSignInDoctorThunk = createAsyncThunk(
  'auth/googleSignInDoctor',
  async (token: string, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      const response = await googleSignInDoctor(token);

      if (response.message === 'Logged in successfully') {
        const userResponse = await getUserProfile();
        const user: User = {
          _id: userResponse._id,
          role: 'doctor',
          email: userResponse.email,
          name: userResponse.name,
        };
        thunkAPI.dispatch(setUser(user));
        return user;
      }

      throw new Error('Unexpected response from server');
    } catch (error) {
      return handleError(error, thunkAPI);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);

export const refreshTokenThunk = createAsyncThunk(
  'auth/refreshToken',
  async (_, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      const response = await refreshToken();

      if (response.message !== 'Token refreshed successfully') {
        throw new Error('Failed to refresh token');
      }

      return response;
    } catch (error) {
      return handleError(error, thunkAPI);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);
