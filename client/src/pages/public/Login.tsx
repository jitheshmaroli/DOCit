import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { useDispatch, useSelector } from 'react-redux';
import { resetAuthState, setError } from '../../redux/slices/authSlice';
import { RootState } from '../../redux/store';
import useAuth from '../../hooks/useAuth';
import { validateEmail, validateLoginPassword } from '../../utils/validation';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import bannerImg from '../../assets/feature-illustration.jpeg';

type LoginType = 'patient' | 'doctor' | 'admin';

const LoginPage: React.FC = () => {
  const [role, setRole] = useState<LoginType>('patient');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [touchedFields, setTouchedFields] = useState({
    email: false,
    password: false,
  });

  const { message } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { login, googleSignInDoctor, googleSignInPatient } = useAuth();
  const {
    user,
    loading,
    error: apiError,
  } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(resetAuthState());
  }, [dispatch]);
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
        default:
          break;
      }
    }
  }, [user, navigate]);

  const validateForm = () => {
    const emailError = validateEmail(formData.email);
    const passwordError = validateLoginPassword(formData.password);
    setFieldErrors({ email: emailError || '', password: passwordError || '' });
    return !emailError && !passwordError;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const error =
      name === 'email'
        ? validateEmail(formData.email)
        : validateLoginPassword(formData.password);
    setFieldErrors((prev) => ({ ...prev, [name]: error || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedFields({ email: true, password: true });
    if (!validateForm()) return;
    dispatch(resetAuthState());
    try {
      login({ email: formData.email, password: formData.password, role });
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleGoogleLogin = async (response: CredentialResponse) => {
    if (response.credential) {
      try {
        const googleToken = response.credential;
        if (role === 'patient') {
          await googleSignInPatient(googleToken);
        } else if (role === 'doctor') {
          await googleSignInDoctor(googleToken);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error('Google signup error:', error);
        dispatch(setError('Google signup failed. Please try again.'));
      }
    }
  };

  const isSubmitDisabled =
    !formData.email ||
    !formData.password ||
    !!fieldErrors.email ||
    !!fieldErrors.password ||
    loading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      {/* Glass Container */}
      <div className="w-full max-w-4xl flex flex-col lg:flex-row rounded-2xl bg-white/10 backdrop-blur-lg shadow-2xl border border-white/20 overflow-hidden">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-1/2 p-8 flex flex-col justify-center">
          <header className="mb-6">
            <Logo />
            <h2 className="text-3xl font-bold text-white mt-4 bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="text-gray-200 text-sm">
              Login to continue your journey
            </p>
          </header>

          {/* Role Selection */}
          <div className="flex gap-4 mb-6">
            {['patient', 'doctor'].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r as LoginType)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  role === r
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'bg-white/20 text-gray-200 hover:bg-white/30'
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {/* Messages */}
          {apiError && apiError !== 'Invalid email or password' && (
            <div className="mb-4 p-3 bg-red-500/20 text-red-200 rounded-lg text-sm">
              {apiError}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-green-500/20 text-green-200 rounded-lg text-sm">
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <p className="mt-1 text-xs text-red-300">{fieldErrors.email}</p>
              )}
            </div>

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

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full p-3 rounded-lg text-white font-medium transition-all duration-300 ${
                isSubmitDisabled
                  ? 'bg-gray-500/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading
                ? 'Logging in...'
                : `Login as ${role.charAt(0).toUpperCase()}${role.slice(1)}`}
            </button>

            <div className="flex items-center justify-center my-4">
              <div className="border-t border-white/20 w-full"></div>
              <span className="px-4 text-gray-300 text-sm">or</span>
              <div className="border-t border-white/20 w-full"></div>
            </div>

            {role !== 'admin' && (
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => setError('Google login error')}
                useOneTap
                theme="filled_black"
                shape="pill"
              />
            )}
          </form>

          <p className="text-center mt-6 text-gray-300 text-sm">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-purple-300 hover:text-purple-200 transition-colors"
              state={{ role }}
            >
              Sign up here
            </Link>
          </p>
        </div>

        {/* Right Side - Image */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 bg-gradient-to-br from-purple-800/50 to-blue-800/50">
          <img
            src={bannerImg}
            alt="Login Illustration"
            className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
