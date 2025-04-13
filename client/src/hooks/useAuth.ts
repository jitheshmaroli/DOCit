import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import {
  signUpPatient,
  signUpDoctor,
  verifySignUpOtp,
  logout,
  googleSignInPatient,
  googleSignInDoctor,
  login,
  forgotPassword,
  resetPassword,
} from '../redux/thunks/authThunks';
import { resetAuthState, resetOtpState } from '../redux/slices/authSlice';
import {
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  SignUpPayload,
  VerifyOtpPayload,
} from '../types/authTypes';

const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading, error, otpSent } = useSelector(
    (state: RootState) => state.auth
  );

  return {
    user,
    loading,
    error,
    otpSent,

    signUpPatient: (payload: SignUpPayload) => dispatch(signUpPatient(payload)),
    signUpDoctor: (payload: SignUpPayload) => dispatch(signUpDoctor(payload)),
    verifySignUpOtp: (payload: VerifyOtpPayload) =>
      dispatch(verifySignUpOtp(payload)),
    login: (payload: LoginPayload) => {
      dispatch(login(payload));
    },
    forgotPassword: (payload: ForgotPasswordPayload) =>
      dispatch(forgotPassword(payload)),
    resetPassword: (payload: ResetPasswordPayload) =>
      dispatch(resetPassword(payload)),
    logout: () => dispatch(logout()),
    googleSignInPatient: (token: string) =>
      dispatch(googleSignInPatient(token)),
    googleSignInDoctor: (token: string) => dispatch(googleSignInDoctor(token)),

    resetAuthState: () => dispatch(resetAuthState()),
    resetOtpState: () => dispatch(resetOtpState()),
  };
};

export default useAuth;
