import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { useDispatch, useSelector } from 'react-redux';
import { resetAuthState, setMessage } from '../../redux/slices/authSlice';
import { RootState } from '../../redux/store';
import useAuth from '../../hooks/useAuth';
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
} from '../../utils/validation';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('email');
  const [countdown, setCountdown] = useState(0);

  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [touchedFields, setTouchedFields] = useState({
    email: false,
    otp: false,
    newPassword: false,
    confirmPassword: false,
  });

  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error: apiError } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    dispatch(resetAuthState());
  }, [dispatch]);
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateField = (name: string, value: string) => {
    if (name === 'email') return validateEmail(value);
    if (name === 'otp') return value.length === 6 ? '' : 'OTP must be 6 digits';
    if (name === 'newPassword') return validatePassword(value);
    if (name === 'confirmPassword')
      return validateConfirmPassword(newPassword, value);
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'email') setEmail(value);
    else if (name === 'otp') setOtp(value.replace(/\D/g, '').slice(0, 6));
    else if (name === 'newPassword') setNewPassword(value);
    else if (name === 'confirmPassword') setConfirmPassword(value);
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: error || '' }));
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedFields((prev) => ({ ...prev, email: true }));
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }
    dispatch(resetAuthState());
    try {
      await forgotPassword({ email });
      setStep('reset');
      setCountdown(60);
    } catch (err) {
      console.error('Failed to send OTP:', err);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    dispatch(resetAuthState());
    try {
      await forgotPassword({ email });
      setCountdown(60);
    } catch (err) {
      console.error('Failed to resend OTP:', err);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(resetAuthState());
    setTouchedFields({
      email: true,
      otp: true,
      newPassword: true,
      confirmPassword: true,
    });
    const otpError = !otp || otp.length !== 6 ? 'OTP must be 6 digits' : '';
    const passwordError = validatePassword(newPassword);
    const confirmError = validateConfirmPassword(newPassword, confirmPassword);
    setFieldErrors({
      email: '',
      otp: otpError,
      newPassword: passwordError || '',
      confirmPassword: confirmError || '',
    });
    if (otpError || passwordError || confirmError) return;
    try {
      await resetPassword({ email, otp, newPassword });
      dispatch(
        setMessage(
          'Password reset successfully. Please login with your new password.'
        )
      );
      navigate('/login');
    } catch (err) {
      console.error('Failed to reset password:', err);
    }
  };

  const isEmailSubmitDisabled = !email || !!fieldErrors.email || loading;
  const isResetSubmitDisabled =
    !otp ||
    !newPassword ||
    !confirmPassword ||
    !!fieldErrors.otp ||
    !!fieldErrors.newPassword ||
    !!fieldErrors.confirmPassword ||
    loading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-lg shadow-2xl border border-white/20 p-8">
        {step === 'email' && (
          <>
            <header className="mb-6">
              <Logo />
              <h2 className="text-2xl font-bold text-white mt-4 bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                Forgot Password
              </h2>
              <p className="text-gray-200 text-sm mt-2">
                Enter your email address and we'll send you a One-Time Password
                (OTP) to reset your password.
              </p>
            </header>

            {apiError && (
              <div className="mb-4 p-3 bg-red-500/20 text-red-200 rounded-lg text-sm">
                {apiError}
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-200 mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    touchedFields.email && fieldErrors.email
                      ? 'focus:ring-red-400'
                      : 'focus:ring-purple-400'
                  }`}
                  required
                />
                {touchedFields.email && fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-300">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isEmailSubmitDisabled}
                className={`w-full p-3 rounded-lg text-white font-medium transition-all duration-300 ${
                  isEmailSubmitDisabled
                    ? 'bg-gray-500/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-purple-300 hover:text-purple-200 transition-colors text-sm"
              >
                Back to Login
              </Link>
            </div>
          </>
        )}

        {step === 'reset' && (
          <>
            <header className="mb-6">
              <Logo />
              <h2 className="text-2xl font-bold text-white mt-4 bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                Reset Password
              </h2>
              <p className="text-gray-200 text-sm mt-2">
                We've sent a 6-digit OTP to{' '}
                <span className="font-semibold">{email}</span>. Please check
                your inbox.
              </p>
            </header>

            {apiError && (
              <div className="mb-4 p-3 bg-red-500/20 text-red-200 rounded-lg text-sm">
                {apiError}
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-200 mb-1"
                >
                  Enter OTP
                </label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={otp}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    touchedFields.otp && fieldErrors.otp
                      ? 'focus:ring-red-400'
                      : 'focus:ring-purple-400'
                  }`}
                  placeholder="Enter 6-digit OTP"
                  required
                />
                {touchedFields.otp && fieldErrors.otp && (
                  <p className="mt-1 text-xs text-red-300">{fieldErrors.otp}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-200 mb-1"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={newPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    touchedFields.newPassword && fieldErrors.newPassword
                      ? 'focus:ring-red-400'
                      : 'focus:ring-purple-400'
                  }`}
                  placeholder="Min 8 chars with upper, lower, number, special"
                  required
                />
                {touchedFields.newPassword && fieldErrors.newPassword && (
                  <p className="mt-1 text-xs text-red-300">
                    {fieldErrors.newPassword}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-200 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    touchedFields.confirmPassword && fieldErrors.confirmPassword
                      ? 'focus:ring-red-400'
                      : 'focus:ring-purple-400'
                  }`}
                  placeholder="Re-enter password"
                  required
                />
                {touchedFields.confirmPassword &&
                  fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-300">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
              </div>

              <button
                type="submit"
                disabled={isResetSubmitDisabled}
                className={`w-full p-3 rounded-lg text-white font-medium transition-all duration-300 ${
                  isResetSubmitDisabled
                    ? 'bg-gray-500/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <div className="mt-4 text-center text-sm">
              <button
                onClick={handleResendOtp}
                className={`text-purple-300 hover:text-purple-200 transition-colors ${countdown > 0 ? 'text-gray-400 cursor-not-allowed' : ''}`}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
              </button>
              <span className="mx-2 text-gray-400">|</span>
              <button
                onClick={() => setStep('email')}
                className="text-purple-300 hover:text-purple-200 transition-colors"
              >
                Change Email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
