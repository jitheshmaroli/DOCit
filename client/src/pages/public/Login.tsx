import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../../components/common/Logo';
import { useDispatch, useSelector } from 'react-redux';
import { resetAuthState, setError } from '../../redux/slices/authSlice';
import { RootState } from '../../redux/store';
import useAuth from '../../hooks/useAuth';
import { validateEmail, validateLoginPassword } from '../../utils/validation';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import bannerImg from '../../assets/feature-illustration.jpeg';
import { AlertCircle, CheckCircle } from 'lucide-react';

type LoginType = 'patient' | 'doctor';

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
        if (role === 'patient') await googleSignInPatient(googleToken);
        else if (role === 'doctor') await googleSignInDoctor(googleToken);
      } catch {
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
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-4xl flex rounded-3xl bg-white shadow-modal overflow-hidden border border-surface-border"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Left - Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-10 flex flex-col justify-center">
          <div className="mb-8">
            <Logo />
            <h2 className="font-display font-bold text-2xl text-text-primary mt-6 mb-1">
              Welcome back
            </h2>
            <p className="text-text-secondary text-sm">
              Sign in to continue to your DOCit account
            </p>
          </div>

          {/* Role tabs */}
          <div className="flex gap-1 p-1 bg-surface-muted rounded-xl mb-6">
            {(['patient', 'doctor'] as LoginType[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  role === r
                    ? 'bg-white text-primary-600 shadow-card'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {/* Alert messages */}
          {apiError && apiError !== 'Invalid email or password' && (
            <div className="mb-4 flex items-start gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle
                size={16}
                className="text-error flex-shrink-0 mt-0.5"
              />
              <p className="text-sm text-red-700">{apiError}</p>
            </div>
          )}
          {message && (
            <div className="mb-4 flex items-start gap-3 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
              <CheckCircle
                size={16}
                className="text-success flex-shrink-0 mt-0.5"
              />
              <p className="text-sm text-emerald-700">{message}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input ${touchedFields.email && fieldErrors.email ? 'input-error' : ''}`}
                required
              />
              {touchedFields.email && fieldErrors.email && (
                <p className="error-text">
                  <AlertCircle size={12} />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input ${touchedFields.password && fieldErrors.password ? 'input-error' : ''}`}
                required
                minLength={6}
                autoComplete="current-password"
              />
              {touchedFields.password && fieldErrors.password && (
                <p className="error-text">
                  <AlertCircle size={12} />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Signing in...
                </span>
              ) : (
                `Sign in as ${role.charAt(0).toUpperCase()}${role.slice(1)}`
              )}
            </button>

            <div className="divider">
              <span className="divider-text">or continue with</span>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => dispatch(setError('Google login error'))}
                useOneTap
                theme="outline"
                shape="rectangular"
                size="large"
                width="100%"
              />
            </div>
          </form>

          <p className="text-center mt-6 text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
              state={{ role }}
            >
              Create account
            </Link>
          </p>
        </div>

        {/* Right - Illustration */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-teal-500 items-center justify-center p-10 relative overflow-hidden">
          {/* Dot grid */}
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
              alt="Login"
              className="max-w-full max-h-[360px] object-contain rounded-2xl shadow-modal mx-auto mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            />
            <h3 className="font-display font-bold text-white text-xl mb-2">
              Your health, our priority
            </h3>
            <p className="text-primary-100 text-sm max-w-xs mx-auto">
              Access top doctors, book appointments, and manage prescriptions
              all in one secure platform.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {[
                '🔒 Secure & Private',
                '⚡ Instant Access',
                '🩺 Verified Doctors',
              ].map((label) => (
                <span
                  key={label}
                  className="bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
