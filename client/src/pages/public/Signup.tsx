import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { resetAuthState, setError, setSignupData } from '../../redux/slices/authSlice';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';

type SignupType = 'patient' | 'doctor';

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

  const signupData = useAppSelector((state: RootState) => state.auth.signupData) || {
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
  };

  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
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
    };
    setFieldErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      console.log('setFormData called in handleChange:', { [name]: value });
      return { ...prev, [name]: value };
    });

    dispatch(setSignupData({ ...signupData,role: signupType, [name]: value }));
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
      if (signupType === 'patient') {
        console.log('signupdata:', data);
        await signUpPatient(data);
      } else {
        console.log('signupdata:', data);
        await signUpDoctor(data);
      }
      setCountdown(60);
    } catch (error) {
      console.error('Signup error:', error);
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
      ...(signupType === 'doctor' && { licenseNumber: signupData.licenseNumber }),
    };
    try {
      console.log('formdata:', formData);
      console.log('verifyData:', verifyData);
      await verifySignUpOtp(verifyData);
    } catch (error) {
      console.error('OTP verification error:', error);
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    });
    resetOtpState();
    setOtp('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row rounded-2xl bg-white/10 backdrop-blur-lg shadow-2xl border border-white/20 overflow-hidden">
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 p-8 flex flex-col justify-center">
          <header className="mb-6">
            <Logo />
            <h2 className="text-3xl font-bold text-white mt-4 bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
              Create an Account
            </h2>
            <p className="text-gray-200 text-sm">
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
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                      : 'bg-white/20 text-gray-200 hover:bg-white/30'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          )}

          {apiError && (
            <div className="mb-4 p-3 bg-red-500/20 text-red-200 rounded-lg text-sm">
              {apiError}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    touchedFields.name && fieldErrors.name
                      ? 'focus:ring-red-400'
                      : 'focus:ring-purple-400'
                  }`}
                  required
                />
                {touchedFields.name && fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-300">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
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

              <div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    touchedFields.phone && fieldErrors.phone
                      ? 'focus:ring-red-400'
                      : 'focus:ring-purple-400'
                  }`}
                  required
                />
                {touchedFields.phone && fieldErrors.phone && (
                  <p className="mt-1 text-xs text-red-300">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              {signupType === 'doctor' && (
                <div>
                  <input
                    type="text"
                    name="licenseNumber"
                    placeholder="Medical License Number"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                      touchedFields.licenseNumber && fieldErrors.licenseNumber
                        ? 'focus:ring-red-400'
                        : 'focus:ring-purple-400'
                    }`}
                    required
                  />
                  {touchedFields.licenseNumber && fieldErrors.licenseNumber && (
                    <p className="mt-1 text-xs text-red-300">
                      {fieldErrors.licenseNumber}
                    </p>
                  )}
                </div>
              )}

              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    touchedFields.password && fieldErrors.password
                      ? 'focus:ring-red-400'
                      : 'focus:ring-purple-400'
                  }`}
                  required
                  minLength={6}
                />
                {touchedFields.password && fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-300">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    touchedFields.confirmPassword && fieldErrors.confirmPassword
                      ? 'focus:ring-red-400'
                      : 'focus:ring-purple-400'
                  }`}
                  required
                  minLength={6}
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
                disabled={!isFormValid() || loading}
                className={`w-full p-3 rounded-lg text-white font-medium transition-all duration-300 ${
                  !isFormValid() || loading
                    ? 'bg-gray-500/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading
                  ? 'Sending OTP...'
                  : `Create ${signupType === 'patient' ? 'Patient' : 'Doctor'} Account`}
              </button>

              <div className="flex items-center justify-center my-4">
                <div className="border-t border-white/20 w-full"></div>
                <span className="px-4 text-gray-300 text-sm">or</span>
                <div className="border-t border-white/20 w-full"></div>
              </div>

              <GoogleLogin
                onSuccess={handleGoogleSignup}
                onError={() => setError('Google signup failed')}
                useOneTap
                theme="filled_black"
                shape="pill"
              />
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-green-300 text-sm">
                We've sent a verification code to {formData.email}. Please check
                your inbox.
              </p>
              <div>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) =>{
                    console.log("otpcahnge",formData)
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  }
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !otp || otp.length < 6}
                className={`w-full p-3 rounded-lg text-white font-medium transition-all duration-300 ${
                  loading || !otp || otp.length < 6
                    ? 'bg-gray-500/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setCountdown(0);
                    handleSubmit({
                      preventDefault: () => {},
                    } as React.FormEvent);
                  }}
                  className={`text-purple-300 hover:text-purple-200 text-sm transition-colors ${
                    countdown > 0 ? 'text-gray-400 cursor-not-allowed' : ''
                  }`}
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {!otpSent && (
            <p className="text-center mt-6 text-gray-300 text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-purple-300 hover:text-purple-200 transition-colors"
              >
                Login here
              </Link>
            </p>
          )}
        </div>

        {/* Right Side - Image */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 bg-gradient-to-br from-purple-800/50 to-blue-800/50">
          <img
            src="/src/assets/feature-illustration.jpeg"
            alt="Signup Illustration"
            className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
