import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { useDispatch, useSelector } from 'react-redux';
import { resetAuthState } from '../../redux/slices/authSlice';
import { RootState } from '../../redux/store';
import useAuth from '../../hooks/useAuth';
import { validateEmail, validateLoginPassword } from '../../utils/validation';
import ROUTES from '../../constants/routeConstants';
import { Shield, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

const AdminLoginPage: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });

  const { message } = useSelector((s: RootState) => s.auth);
  const {
    user,
    loading,
    error: apiError,
  } = useSelector((s: RootState) => s.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { login } = useAuth();

  useEffect(() => {
    dispatch(resetAuthState());
  }, [dispatch]);
  useEffect(() => {
    if (user?.role === 'admin') navigate(ROUTES.ADMIN.DASHBOARD);
  }, [user, navigate]);

  const validateForm = () => {
    const errors = {
      email: validateEmail(formData.email) || '',
      password: validateLoginPassword(formData.password) || '',
    };
    setFieldErrors(errors);
    return !errors.email && !errors.password;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (fieldErrors[name as keyof typeof fieldErrors])
      setFieldErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    const error =
      name === 'email'
        ? validateEmail(formData.email)
        : validateLoginPassword(formData.password);
    setFieldErrors((p) => ({ ...p, [name]: error || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!validateForm()) return;
    dispatch(resetAuthState());
    try {
      await login({
        email: formData.email,
        password: formData.password,
        role: 'admin',
      });
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const isDisabled =
    !formData.email ||
    !formData.password ||
    !!fieldErrors.email ||
    !!fieldErrors.password ||
    loading;

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-4">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-100 opacity-60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-teal-100 opacity-60 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="card p-8 animate-fade-in-up">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center shadow-btn-primary mb-4">
              <Shield size={26} className="text-white" />
            </div>
            <Logo />
            <h2 className="text-2xl font-display font-bold text-text-primary mt-3">
              Admin Portal
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Sign in to manage the platform
            </p>
          </div>

          {/* Alerts */}
          {apiError && apiError !== 'Invalid email or password' && (
            <div className="flex items-start gap-2.5 mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle
                size={15}
                className="text-error flex-shrink-0 mt-0.5"
              />
              <p className="text-sm text-red-700">{apiError}</p>
            </div>
          )}
          {message && (
            <div className="flex items-start gap-2.5 mb-5 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
              <CheckCircle
                size={15}
                className="text-emerald-600 flex-shrink-0 mt-0.5"
              />
              <p className="text-sm text-emerald-700">{message}</p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="label mb-1.5">Email Address</label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="admin@docit.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`input pl-10 ${touched.email && fieldErrors.email ? 'input-error' : ''}`}
                  required
                />
              </div>
              {touched.email && fieldErrors.email && (
                <p className="error-text mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label mb-1.5">Password</label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`input pl-10 ${touched.password && fieldErrors.password ? 'input-error' : ''}`}
                  required
                  minLength={6}
                />
              </div>
              {touched.password && fieldErrors.password && (
                <p className="error-text mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="button"
              disabled={isDisabled}
              onClick={handleSubmit}
              className={`btn-primary w-full justify-center py-2.5 ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Sign in as Admin'
              )}
            </button>
          </div>

          {/* Footer */}
          <p className="text-center mt-6 text-sm text-text-muted">
            Not an admin?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
