/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../../components/common/Logo';
import useAuth from '../../hooks/useAuth';
import {
  validateConfirmPassword,
  validateEmail,
  validateLicenseNumber,
  validateName,
  validatePassword,
  validatePhone,
} from '../../utils/validation';
import { useDispatch } from 'react-redux';
import {
  resetAuthState,
  setError,
  setSignupData,
} from '../../redux/slices/authSlice';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import bannerImg from '../../assets/feature-illustration.jpeg';
import { AlertCircle, Mail } from 'lucide-react';

type SignupType = 'patient' | 'doctor';

interface InputFieldProps {
  name: string;
  type: string;
  placeholder: string;
  value: string;
  label?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  touchedFields: Record<string, boolean>;
  fieldErrors: Record<string, string>;
}

const InputField: React.FC<InputFieldProps> = ({
  name,
  type,
  placeholder,
  value,
  label,
  onChange,
  onBlur,
  touchedFields,
  fieldErrors,
}) => (
  <div>
    {label && <label className="label">{label}</label>}
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className={`input ${touchedFields[name] && fieldErrors[name] ? 'input-error' : ''}`}
      required
      minLength={name.toLowerCase().includes('password') ? 6 : undefined}
      autoComplete={
        name === 'password'
          ? 'new-password'
          : name === 'confirmPassword'
            ? 'new-password'
            : undefined
      }
    />
    {touchedFields[name] && fieldErrors[name] && (
      <p className="error-text">
        <AlertCircle size={12} />
        {fieldErrors[name]}
      </p>
    )}
  </div>
);

const SignupPage: React.FC = () => {
  const [signupType, setSignupType] = useState<SignupType>('patient');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
  });

  const signupData = useAppSelector(
    (state: RootState) => state.auth.signupData
  ) || {
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
    _id: '',
  };

  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
    form: '',
  });

  const [touchedFields, setTouchedFields] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    licenseNumber: false,
  });

  const {
    signUpPatient,
    signUpDoctor,
    verifySignUpOtp,
    resendSignupOTP,
    otpSent,
    loading,
    error: apiError,
    resetOtpState,
    user,
    googleSignInPatient,
    googleSignInDoctor,
  } = useAuth();

  useEffect(() => {
    dispatch(resetAuthState());
  }, [dispatch]);
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'patient':
          navigate('/patient/find-doctor');
          break;
        case 'doctor':
          navigate('/doctor/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
      }
    }
  }, [user, navigate]);

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'name':
        return validateName(value);
      case 'email':
        return validateEmail(value);
      case 'phone':
        return validatePhone(value);
      case 'password':
        return validatePassword(value);
      case 'confirmPassword':
        return validateConfirmPassword(formData.password, value);
      case 'licenseNumber':
        return signupType === 'doctor' ? validateLicenseNumber(value) : '';
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: validateName(formData.name) || '',
      email: validateEmail(formData.email) || '',
      phone: validatePhone(formData.phone) || '',
      password: validatePassword(formData.password) || '',
      confirmPassword:
        validateConfirmPassword(formData.password, formData.confirmPassword) ||
        '',
      licenseNumber:
        signupType === 'doctor'
          ? validateLicenseNumber(formData.licenseNumber) || ''
          : '',
      form: '',
    };
    setFieldErrors(newErrors);
    return !Object.values(newErrors).some((e) => e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    dispatch(setSignupData({ ...signupData, role: signupType, [name]: value }));
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

  const isFormValid = () =>
    formData.name &&
    formData.email &&
    formData.phone &&
    formData.password &&
    formData.confirmPassword &&
    (signupType === 'patient' || formData.licenseNumber) &&
    !Object.values(fieldErrors).some((e) => e);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedFields({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      licenseNumber: true,
    });
    if (!validateForm()) return;
    const data = {
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      name: formData.name,
      role: signupType,
      ...(signupType === 'doctor' && { licenseNumber: formData.licenseNumber }),
    };
    try {
      let response;
      if (signupType === 'patient') response = await signUpPatient(data);
      else response = await signUpDoctor(data);
      if (response.payload?._id) {
        dispatch(
          setSignupData({
            ...signupData,
            _id: response.payload._id,
            role: signupType,
          })
        );
      }
      setCountdown(60);
    } catch (error) {
      console.error('Signup error:', error);
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendSignupOTP(formData.email, signupType);
      setCountdown(60);
      setFieldErrors((prev) => ({ ...prev, form: '' }));
    } catch (error: any) {
      setFieldErrors((prev) => ({
        ...prev,
        form: error.payload?.message || 'Failed to resend OTP',
      }));
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setFieldErrors((prev) => ({ ...prev, form: 'OTP must be 6 characters' }));
      return;
    }
    const verifyData = {
      email: signupData.email,
      otp,
      password: signupData.password,
      phone: signupData.phone,
      name: signupData.name,
      role: signupType,
      _id: signupData._id,
      ...(signupType === 'doctor' && {
        licenseNumber: signupData.licenseNumber,
      }),
    };
    try {
      await verifySignUpOtp(verifyData);
    } catch (error: any) {
      setFieldErrors((prev) => ({
        ...prev,
        form:
          error.payload?.message || 'Something went wrong. Please try again.',
      }));
    }
  };

  const handleGoogleSignup = async (response: CredentialResponse) => {
    if (response.credential) {
      try {
        const googleToken = response.credential;
        if (signupType === 'patient') await googleSignInPatient(googleToken);
        else await googleSignInDoctor(googleToken);
      } catch {
        dispatch(setError('Google signup failed. Please try again.'));
      }
    }
  };

  const switchSignupType = (type: SignupType) => {
    setSignupType(type);
    setFieldErrors({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      licenseNumber: '',
      form: '',
    });
    resetOtpState();
    setOtp('');
  };

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-4 py-8">
      <motion.div
        className="w-full max-w-4xl flex rounded-3xl bg-white shadow-modal overflow-hidden border border-surface-border"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Left - Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <Logo />
            <h2 className="font-display font-bold text-2xl text-text-primary mt-6 mb-1">
              {otpSent ? 'Verify your email' : 'Create your account'}
            </h2>
            <p className="text-text-secondary text-sm">
              {otpSent
                ? `We sent a 6-digit code to ${formData.email}`
                : 'Join DOCit and start your healthcare journey'}
            </p>
          </div>

          {/* Role tabs */}
          {!otpSent && (
            <div className="flex gap-1 p-1 bg-surface-muted rounded-xl mb-6">
              {(['patient', 'doctor'] as SignupType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => switchSignupType(type)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    signupType === type
                      ? 'bg-white text-primary-600 shadow-card'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Error messages */}
          {apiError && (
            <div className="mb-4 flex items-start gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle
                size={16}
                className="text-error flex-shrink-0 mt-0.5"
              />
              <p className="text-sm text-red-700">{apiError}</p>
            </div>
          )}
          {fieldErrors.form && (
            <div className="mb-4 flex items-start gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle
                size={16}
                className="text-error flex-shrink-0 mt-0.5"
              />
              <p className="text-sm text-red-700">{fieldErrors.form}</p>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <InputField
                    name="name"
                    type="text"
                    placeholder="Full name"
                    label="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    touchedFields={touchedFields}
                    fieldErrors={fieldErrors}
                  />
                </div>
                <div className="col-span-2">
                  <InputField
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    label="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    touchedFields={touchedFields}
                    fieldErrors={fieldErrors}
                  />
                </div>
                <div className="col-span-2">
                  <InputField
                    name="phone"
                    type="tel"
                    placeholder="+91 99999 99999"
                    label="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    touchedFields={touchedFields}
                    fieldErrors={fieldErrors}
                  />
                </div>
                {signupType === 'doctor' && (
                  <div className="col-span-2">
                    <InputField
                      name="licenseNumber"
                      type="text"
                      placeholder="MCI-XXXXXXXXXX"
                      label="Medical License Number"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      touchedFields={touchedFields}
                      fieldErrors={fieldErrors}
                    />
                  </div>
                )}
                <div>
                  <InputField
                    name="password"
                    type="password"
                    placeholder="Password"
                    label="Password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    touchedFields={touchedFields}
                    fieldErrors={fieldErrors}
                  />
                </div>
                <div>
                  <InputField
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm"
                    label="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    touchedFields={touchedFields}
                    fieldErrors={fieldErrors}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!isFormValid() || loading}
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Sending verification...
                  </span>
                ) : (
                  `Create ${signupType === 'patient' ? 'Patient' : 'Doctor'} Account`
                )}
              </button>

              <div className="divider">
                <span className="divider-text">or</span>
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSignup}
                  onError={() => dispatch(setError('Google signup failed'))}
                  useOneTap
                  theme="outline"
                  shape="rectangular"
                  size="large"
                  width="100%"
                />
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* Email indicator */}
              <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl border border-primary-100">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    Check your inbox
                  </p>
                  <p className="text-xs text-text-secondary">
                    {formData.email}
                  </p>
                </div>
              </div>

              <div>
                <label className="label">6-Digit Verification Code</label>
                <input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  className="input text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !otp || otp.length < 6}
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Verifying...
                  </span>
                ) : (
                  'Verify & Create Account'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0}
                  className={`text-sm font-medium transition-colors ${
                    countdown > 0
                      ? 'text-text-muted cursor-not-allowed'
                      : 'text-primary-600 hover:text-primary-700'
                  }`}
                >
                  {countdown > 0
                    ? `Resend code in ${countdown}s`
                    : 'Resend verification code'}
                </button>
              </div>
            </form>
          )}

          {!otpSent && (
            <p className="text-center mt-6 text-sm text-text-secondary">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
              >
                Sign in
              </Link>
            </p>
          )}
        </div>

        {/* Right - Illustration */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-500 to-primary-600 items-center justify-center p-10 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          ></div>
          <div className="relative z-10 text-center">
            <motion.img
              src={bannerImg}
              alt="Signup"
              className="max-w-full max-h-[320px] object-contain rounded-2xl shadow-modal mx-auto mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            />
            <h3 className="font-display font-bold text-white text-xl mb-2">
              Join thousands of patients
            </h3>
            <p className="text-teal-100 text-sm max-w-xs mx-auto mb-6">
              Get access to top doctors, book appointments instantly, and manage
              your health records.
            </p>
            <div className="space-y-2">
              {[
                '✓ Free to get started',
                '✓ Verified doctor network',
                '✓ Secure & confidential',
              ].map((item) => (
                <p key={item} className="text-white/90 text-sm font-medium">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;
