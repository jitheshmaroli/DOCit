import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/config';
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

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, 
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleError = (error: any, thunkAPI: any) => {
  let message = 'An error occurred';
  let statusCode = 500;

  if (error.response) {
    statusCode = error.response.status;
    message =
      error.response.data?.message ||
      error.response.statusText ||
      'An error occurred';

    if (statusCode === 401 && error.config.url.includes('/api/auth/me')) {
      thunkAPI.dispatch(setInitialAuthCheckComplete());
      return thunkAPI.rejectWithValue(null);
    }
  } else if (error.request) {
    message = 'No response from server';
  } else {
    message = error.message || 'Request setup error';
  }

  thunkAPI.dispatch(setError(message));
  return thunkAPI.rejectWithValue(message);
};

export const signUpPatient = createAsyncThunk(
  'auth/signUp',
  async (
    payload: {
      email: string;
      password: string;
      name: string;
      phone: string;
      role: string;
      licenseNumber?: string;
    },
    thunkAPI
  ) => {
    try {
      thunkAPI.dispatch(setLoading(true));

      const response = await api.post(
        `${API_BASE_URL}/api/auth/patient/signup`,
        payload
      );

      if (response.data.message === 'OTP sent to your email') {
        thunkAPI.dispatch(otpSentSuccess());
        thunkAPI.dispatch(setSignupData(payload));
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

export const signUpDoctor = createAsyncThunk(
  'auth/signUpDoctor',
  async (payload: SignUpPayload, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));

      const response = await api.post(
        `${API_BASE_URL}/api/auth/doctor/signup`,
        payload
      );

      if (response.data.message === 'OTP sent to your email') {
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

export const verifySignUpOtp = createAsyncThunk(
  'auth/verifySignUpOtp',
  async (payload: VerifyOtpPayload, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));

      const response = await api.post(
        `${API_BASE_URL}/api/auth/verify-signup-otp`,
        payload
      );

      const user = {
        _id: response.data._id,
        email: response.data.email,
        name: response.data.name,
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

export const login = createAsyncThunk(
  'auth/login',
  async (
    payload: {
      email: string;
      password: string;
      role: string;
    },
    thunkAPI
  ) => {
    try {
      thunkAPI.dispatch(setLoading(true));

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
          return thunkAPI.rejectWithValue({
            message: 'Invalid role',
            statusCode: 400,
          });
      }

      const response = await api.post(`${API_BASE_URL}${endpoint}`, {
        email: payload.email,
        password: payload.password,
      });


      if (response.data.message === 'Logged in successfully') {
        try {
          const userResponse = await api.get(`${API_BASE_URL}/api/user/me`);
          const user = {
            _id: userResponse.data._id,
            email: userResponse.data.email,
            name: userResponse.data.name,
            role: userResponse.data.role || payload.role,
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

export const logout = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
  try {
    thunkAPI.dispatch(setLoading(true));

    await api.post(`${API_BASE_URL}/api/auth/logout`);

    thunkAPI.dispatch(clearUser());
  } catch (error) {
    return handleError(error, thunkAPI);
  } finally {
    thunkAPI.dispatch(clearUser());
    thunkAPI.dispatch(setLoading(false));
  }
});

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (expectedRole: 'patient' | 'doctor' | 'admin' | undefined, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      const response = await api.get(`${API_BASE_URL}/api/user/me`);

      const user = {
        _id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role || expectedRole,
        phone: response.data.phone,
      };

      thunkAPI.dispatch(setUser(user));
      return user;
    } catch (error) {
      thunkAPI.dispatch(clearUser());
      return handleError(error, thunkAPI);
    } finally {
      thunkAPI.dispatch(setLoading(false));
      thunkAPI.dispatch(setInitialAuthCheckComplete());
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (payload: ResetPasswordPayload, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      const response = await api.post(
        `${API_BASE_URL}/api/auth/reset-password`,
        payload
      );

      if (response.data.message !== 'Password reset successfully') {
        throw new Error(response.data.message || 'Failed to reset password');
      }

      return response.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      let message = 'An error occurred';
      if (error.response) {
        message =
          error.response.data?.message ||
          error.response.statusText ||
          'Failed to reset password';
      } else if (error.message) {
        message = error.message;
      }
      thunkAPI.dispatch(setError(message));
      return thunkAPI.rejectWithValue(message);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (payload: ForgotPasswordPayload, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      const response = await api.post(
        `${API_BASE_URL}/api/auth/forgot-password`,
        payload
      );
      return response.data;
    } catch (error) {
      return handleError(error, thunkAPI);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);

export const googleSignInPatient = createAsyncThunk(
  'auth/googleSignInPatient',
  async (token: string, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));

      const response = await api.post(
        `${API_BASE_URL}/api/auth/patient/google-signin`,
        { token }
      );

      if (response.data.message === 'Logged in successfully') {
        const userResponse = await api.get(`${API_BASE_URL}/api/user/me`);
        const user: User = {
          _id: userResponse.data._id,
          role: 'patient',
          email: userResponse.data.email,
          name: userResponse.data.name,
        };
        thunkAPI.dispatch(setUser(user));
        return user;
      }

      // return response.data;
    } catch (error) {
      return handleError(error, thunkAPI);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);

export const googleSignInDoctor = createAsyncThunk(
  'auth/googleSignInDoctor',
  async (token: string, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));

      const response = await api.post(
        `${API_BASE_URL}/api/auth/doctor/google-signin`,
        { token }
      );

      if (response.data.message === 'Logged in successfully') {
        const userResponse = await api.get(`${API_BASE_URL}/api/user/me`);
        const user: User = {
          _id: userResponse.data._id,
          role: 'doctor',
          email: userResponse.data.email,
          name: userResponse.data.name,
        };
        thunkAPI.dispatch(setUser(user));

        return user;
      }

      return response.data;
    } catch (error) {
      return handleError(error, thunkAPI);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);
