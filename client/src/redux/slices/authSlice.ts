import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SignUpPayload, User } from '../../types/authTypes';



interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  otpSent: boolean;
  message: string | null;
  initialAuthCheckComplete: boolean;
  signupData: SignUpPayload | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  otpSent: false,
  message: null,
  signupData: null,
  initialAuthCheckComplete: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.error = null;
      state.initialAuthCheckComplete = true; 
    },
    setError(state, action: PayloadAction<string>) {
      
      if (!state.initialAuthCheckComplete && action.payload === 'Invalid email or password') {
        return;
      }
      state.error = action.payload;
      state.loading = false;
    },
    clearUser(state) {
      state.user = null;
      state.initialAuthCheckComplete = true;
    },
    otpSentSuccess(state) {
      state.otpSent = true;
    },
    resetOtpState(state) {
      state.otpSent = false;
    },
    resetAuthState(state) {
      state.error = null;
      state.loading = false;
    },
    setMessage(state, action: PayloadAction<string>) {
      state.message = action.payload;
    },
    clearMessage(state) {
      state.message = null;
    },
    setInitialAuthCheckComplete(state) {
      state.initialAuthCheckComplete = true;
    },
    setSignupData(state, action: PayloadAction<SignUpPayload>) {
      state.signupData = action.payload;
    },
    clearSignupData(state) {
      state.signupData = null;
    },
  },
});

export const {
  resetAuthState,
  resetOtpState,
  setLoading,
  setUser,
  clearUser,
  setError,
  otpSentSuccess,
  setMessage,
  clearMessage,
  setInitialAuthCheckComplete,
  setSignupData,
  clearSignupData
} = authSlice.actions;

export default authSlice.reducer;