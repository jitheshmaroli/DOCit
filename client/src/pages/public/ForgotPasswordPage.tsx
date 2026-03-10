import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import { AlertCircle, ArrowLeft, Mail, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary-600 transition-colors mb-6 font-medium"
        >
          <ArrowLeft size={16} /> Back to sign in
        </Link>

        <motion.div
          className="bg-white rounded-3xl shadow-modal border border-surface-border p-8 md:p-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <Logo />
          </div>

          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Icon */}
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-6">
                  <Mail size={28} className="text-primary-600" />
                </div>

                <h2 className="font-display font-bold text-2xl text-text-primary mb-2">
                  Reset your password
                </h2>
                <p className="text-text-secondary text-sm mb-6">
                  Enter your email and we'll send you a one-time password to
                  reset your account.
                </p>

                {apiError && (
                  <div className="mb-4 flex items-start gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl">
                    <AlertCircle
                      size={16}
                      className="text-error flex-shrink-0 mt-0.5"
                    />
                    <p className="text-sm text-red-700">{apiError}</p>
                  </div>
                )}

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label className="label">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`input ${touchedFields.email && fieldErrors.email ? 'input-error' : ''}`}
                    />
                    {touchedFields.email && fieldErrors.email && (
                      <p className="error-text">
                        <AlertCircle size={12} />
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isEmailSubmitDisabled}
                    className="btn-primary w-full py-3 text-base"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Sending...
                      </span>
                    ) : (
                      'Send Reset Code'
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="reset-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck size={28} className="text-teal-600" />
                </div>

                <h2 className="font-display font-bold text-2xl text-text-primary mb-2">
                  Create new password
                </h2>
                <p className="text-text-secondary text-sm mb-6">
                  Enter the code sent to{' '}
                  <span className="font-semibold text-text-primary">
                    {email}
                  </span>{' '}
                  and set your new password.
                </p>

                {apiError && (
                  <div className="mb-4 flex items-start gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl">
                    <AlertCircle
                      size={16}
                      className="text-error flex-shrink-0 mt-0.5"
                    />
                    <p className="text-sm text-red-700">{apiError}</p>
                  </div>
                )}

                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label className="label">Verification Code</label>
                    <input
                      type="text"
                      name="otp"
                      placeholder="000000"
                      value={otp}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`input text-center text-2xl tracking-[0.5em] font-mono ${touchedFields.otp && fieldErrors.otp ? 'input-error' : ''}`}
                    />
                    {touchedFields.otp && fieldErrors.otp && (
                      <p className="error-text">
                        <AlertCircle size={12} />
                        {fieldErrors.otp}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="label">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      placeholder="Min. 8 characters"
                      value={newPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`input ${touchedFields.newPassword && fieldErrors.newPassword ? 'input-error' : ''}`}
                    />
                    {touchedFields.newPassword && fieldErrors.newPassword && (
                      <p className="error-text">
                        <AlertCircle size={12} />
                        {fieldErrors.newPassword}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="label">Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`input ${touchedFields.confirmPassword && fieldErrors.confirmPassword ? 'input-error' : ''}`}
                    />
                    {touchedFields.confirmPassword &&
                      fieldErrors.confirmPassword && (
                        <p className="error-text">
                          <AlertCircle size={12} />
                          {fieldErrors.confirmPassword}
                        </p>
                      )}
                  </div>

                  <button
                    type="submit"
                    disabled={isResetSubmitDisabled}
                    className="btn-primary w-full py-3 text-base"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Resetting...
                      </span>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>

                <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                  <button
                    onClick={handleResendOtp}
                    disabled={countdown > 0}
                    className={`font-medium transition-colors ${countdown > 0 ? 'text-text-muted cursor-not-allowed' : 'text-primary-600 hover:text-primary-700'}`}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                  </button>
                  <span className="text-surface-border">•</span>
                  <button
                    onClick={() => setStep('email')}
                    className="text-text-secondary hover:text-text-primary font-medium"
                  >
                    Change email
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
