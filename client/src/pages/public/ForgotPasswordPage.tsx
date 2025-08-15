import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  const [step, setStep] = useState<'email' | 'reset'>('email');
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
  const { loading, error: apiError } = useSelector((state: RootState) => state.auth);

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
    if (name === 'confirmPassword') return validateConfirmPassword(newPassword, value);
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
      dispatch(setMessage('Password reset successfully. Please login with your new password.'));
      navigate('/login');
    } catch (err) {
      console.error('Failed to reset password:', err);
    }
  };

  const isEmailSubmitDisabled = !email || !!fieldErrors.email || loading;
  const isResetSubmitDisabled =
    !otp || !newPassword || !confirmPassword ||
    !!fieldErrors.otp || !!fieldErrors.newPassword || !!fieldErrors.confirmPassword || loading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#320A6B] via-[#065084] to-[#0F828C] flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md rounded-2xl bg-[#0F828C]/10 backdrop-blur-lg shadow-2xl border border-[#78B9B5]/20 p-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {step === 'email' && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <header className="mb-6">
              <Logo />
              <h2 className="text-2xl font-bold mt-4 bg-gradient-to-r from-[#78B9B5] to-[#320A6B] bg-clip-text text-transparent">
                Forgot Password
              </h2>
              <p className="text-[#78B9B5] text-sm mt-2">
                Enter your email address and we'll send you a One-Time Password (OTP) to reset your password.
              </p>
            </header>

            {apiError && (
              <motion.div
                className="mb-4 p-3 bg-[#320A6B]/20 text-[#320A6B] rounded-lg text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {apiError}
              </motion.div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-3 bg-[#0F828C]/10 border border-[#78B9B5]/20 rounded-lg text-[#0F828C] placeholder-[#78B9B5] focus:outline-none focus:ring-2 ${
                  touchedFields.email && fieldErrors.email ? 'focus:ring-red-400' : 'focus:ring-[#0F828C]'
                }`}
              />
              {touchedFields.email && fieldErrors.email && (
                <p className="mt-1 text-xs text-[#320A6B]">{fieldErrors.email}</p>
              )}

              <motion.button
                type="submit"
                disabled={isEmailSubmitDisabled}
                className={`w-full p-3 rounded-lg text-white font-medium ${
                  isEmailSubmitDisabled
                    ? 'bg-gray-500/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#0F828C] to-[#78B9B5] hover:from-[#065084] hover:to-[#320A6B]'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-[#320A6B] hover:text-[#065084] text-sm">
                Back to Login
              </Link>
            </div>
          </motion.div>
        )}

        {step === 'reset' && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <header className="mb-6">
              <Logo />
              <h2 className="text-2xl font-bold mt-4 bg-gradient-to-r from-[#78B9B5] to-[#320A6B] bg-clip-text text-transparent">
                Reset Password
              </h2>
              <p className="text-[#78B9B5] text-sm mt-2">
                We've sent a 6-digit OTP to <span className="font-semibold">{email}</span>. Please check your inbox.
              </p>
            </header>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <input
                type="text"
                name="otp"
                placeholder="Enter OTP"
                value={otp}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-3 bg-[#0F828C]/10 border border-[#78B9B5]/20 rounded-lg text-[#0F828C] placeholder-[#78B9B5] focus:outline-none ${
                  touchedFields.otp && fieldErrors.otp ? 'focus:ring-red-400' : 'focus:ring-[#0F828C]'
                }`}
              />
              {touchedFields.otp && fieldErrors.otp && (
                <p className="mt-1 text-xs text-[#320A6B]">{fieldErrors.otp}</p>
              )}

              <input
                type="password"
                name="newPassword"
                placeholder="New Password"
                value={newPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-3 bg-[#0F828C]/10 border border-[#78B9B5]/20 rounded-lg text-[#0F828C] placeholder-[#78B9B5] focus:outline-none ${
                  touchedFields.newPassword && fieldErrors.newPassword ? 'focus:ring-red-400' : 'focus:ring-[#0F828C]'
                }`}
              />
              {touchedFields.newPassword && fieldErrors.newPassword && (
                <p className="mt-1 text-xs text-[#320A6B]">{fieldErrors.newPassword}</p>
              )}

              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-3 bg-[#0F828C]/10 border border-[#78B9B5]/20 rounded-lg text-[#0F828C] placeholder-[#78B9B5] focus:outline-none ${
                  touchedFields.confirmPassword && fieldErrors.confirmPassword ? 'focus:ring-red-400' : 'focus:ring-[#0F828C]'
                }`}
              />
              {touchedFields.confirmPassword && fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-[#320A6B]">{fieldErrors.confirmPassword}</p>
              )}

              <motion.button
                type="submit"
                disabled={isResetSubmitDisabled}
                whileTap={{ scale: 0.95 }}
                className={`w-full p-3 rounded-lg text-white font-medium ${
                  isResetSubmitDisabled
                    ? 'bg-gray-500/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#0F828C] to-[#78B9B5] hover:from-[#065084] hover:to-[#320A6B]'
                }`}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </motion.button>
            </form>

            <div className="mt-4 text-center text-sm">
              <button
                onClick={handleResendOtp}
                disabled={countdown > 0}
                className={`text-[#320A6B] hover:text-[#065084] ${
                  countdown > 0 ? 'text-[#78B9B5] cursor-not-allowed' : ''
                }`}
              >
                {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
              </button>
              <span className="mx-2 text-[#78B9B5]">|</span>
              <button
                onClick={() => setStep('email')}
                className="text-[#320A6B] hover:text-[#065084]"
              >
                Change Email
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
