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

type SignupType = 'patient' | 'doctor';

interface InputFieldProps {
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  touchedFields: { [key: string]: boolean };
  fieldErrors: { [key: string]: string };
}

const InputField: React.FC<InputFieldProps> = ({
  name,
  type,
  placeholder,
  value,
  onChange,
  onBlur,
  touchedFields,
  fieldErrors,
}) => (
  <div>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className={`w-full p-3 bg-[#0F828C]/10 border border-[#78B9B5]/20 rounded-lg text-[#0F828C] placeholder-[#78B9B5] focus:outline-none focus:ring-2 ${
        touchedFields[name] && fieldErrors[name]
          ? 'focus:ring-red-400'
          : 'focus:ring-[#0F828C]'
      }`}
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
      <p className="mt-1 text-xs text-[#320A6B]">{fieldErrors[name]}</p>
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
    return !Object.values(newErrors).some((error) => error);
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

  const isFormValid = () => {
    return (
      formData.name &&
      formData.email &&
      formData.phone &&
      formData.password &&
      formData.confirmPassword &&
      (signupType === 'patient' || formData.licenseNumber) &&
      !Object.values(fieldErrors).some((error) => error)
    );
  };

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
      if (signupType === 'patient') {
        response = await signUpPatient(data);
      } else {
        response = await signUpDoctor(data);
      }
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
      console.error('Resend OTP error:', error);
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
      console.error('OTP verification error:', error);
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
        if (signupType === 'patient') {
          await googleSignInPatient(googleToken);
        } else {
          await googleSignInDoctor(googleToken);
        }
      } catch (error: any) {
        console.error('Google signup error:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-[#320A6B] via-[#065084] to-[#0F828C] flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-4xl flex flex-col lg:flex-row rounded-2xl bg-[#78B9B5]/10 backdrop-blur-lg shadow-2xl border border-[#78B9B5]/20 overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <motion.div
          className="w-full lg:w-1/2 p-8 flex flex-col justify-center"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <header className="mb-6">
            <Logo />
            <h2 className="text-3xl font-bold mt-4 bg-gradient-to-r from-[#78B9B5] to-[#0F828C] bg-clip-text text-transparent">
              Create an Account
            </h2>
            <p className="text-[#78B9B5] text-sm">
              Enter your details to start your journey
            </p>
          </header>

          {!otpSent && (
            <div className="flex gap-4 mb-6">
              {['patient', 'doctor'].map((type) => (
                <button
                  key={type}
                  onClick={() => switchSignupType(type as SignupType)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    signupType === type
                      ? 'bg-gradient-to-r from-[#0F828C] to-[#78B9B5] text-white shadow-lg'
                      : 'bg-white/20 text-[#78B9B5] hover:bg-white/30'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          )}

          {apiError && (
            <div className="mb-4 p-3 bg-[#320A6B]/20 text-[#320A6B] rounded-lg text-sm">
              {apiError}
            </div>
          )}

          {fieldErrors.form && (
            <div className="mb-4 p-3 bg-[#320A6B]/20 text-[#320A6B] rounded-lg text-sm">
              {fieldErrors.form}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField
                name="name"
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                touchedFields={touchedFields}
                fieldErrors={fieldErrors}
              />
              <InputField
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                touchedFields={touchedFields}
                fieldErrors={fieldErrors}
              />
              <InputField
                name="phone"
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                touchedFields={touchedFields}
                fieldErrors={fieldErrors}
              />
              {signupType === 'doctor' && (
                <InputField
                  name="licenseNumber"
                  type="text"
                  placeholder="Medical License Number"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  touchedFields={touchedFields}
                  fieldErrors={fieldErrors}
                />
              )}
              <InputField
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                touchedFields={touchedFields}
                fieldErrors={fieldErrors}
              />
              <InputField
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                touchedFields={touchedFields}
                fieldErrors={fieldErrors}
              />

              <motion.button
                type="submit"
                disabled={!isFormValid() || loading}
                className={`w-full p-3 rounded-lg text-white font-medium transition-all duration-300 ${
                  !isFormValid() || loading
                    ? 'bg-gray-500/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#0F828C] to-[#78B9B5] hover:from-[#065084] hover:to-[#320A6B] shadow-lg hover:shadow-xl'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {loading
                  ? 'Sending OTP...'
                  : `Create ${signupType === 'patient' ? 'Patient' : 'Doctor'} Account`}
              </motion.button>

              <div className="flex items-center justify-center my-4">
                <div className="border-t border-[#78B9B5]/20 w-full"></div>
                <span className="px-4 text-[#0F828C] text-sm">or</span>
                <div className="border-t border-[#78B9B5]/20 w-full"></div>
              </div>

              <GoogleLogin
                onSuccess={handleGoogleSignup}
                onError={() => dispatch(setError('Google signup failed'))}
                useOneTap
                theme="filled_black"
                shape="pill"
              />
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-[#78B9B5] text-sm">
                We've sent a verification code to {formData.email}. Please check
                your inbox.
              </p>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                className="w-full p-3 bg-[#0F828C]/10 border border-[#78B9B5]/20 rounded-lg text-[#0F828C] placeholder-[#78B9B5] focus:outline-none focus:ring-2 focus:ring-[#0F828C]"
                maxLength={6}
                required
              />
              <motion.button
                type="submit"
                disabled={loading || !otp || otp.length < 6}
                className={`w-full p-3 rounded-lg text-white font-medium transition-all duration-300 ${
                  loading || !otp || otp.length < 6
                    ? 'bg-gray-500/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#0F828C] to-[#78B9B5] hover:from-[#065084] hover:to-[#320A6B] shadow-lg hover:shadow-xl'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </motion.button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className={`text-[#320A6B] hover:text-[#065084] text-sm transition-colors ${
                    countdown > 0 ? 'text-[#78B9B5] cursor-not-allowed' : ''
                  }`}
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {!otpSent && (
            <p className="text-center mt-6 text-[#78B9B5] text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-[#320A6B] hover:text-[#065084] transition-colors"
              >
                Login here
              </Link>
            </p>
          )}
        </motion.div>

        <motion.div
          className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 bg-gradient-to-br from-[#065084]/50 to-[#0F828C]/50"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <motion.img
            src={bannerImg}
            alt="Signup Illustration"
            className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SignupPage;
