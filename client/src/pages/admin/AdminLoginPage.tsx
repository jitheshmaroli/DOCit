import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { useDispatch, useSelector } from 'react-redux';
import { resetAuthState } from '../../redux/slices/authSlice';
import { RootState } from '../../redux/store';
import useAuth from '../../hooks/useAuth';
import { validateEmail, validateLoginPassword } from '../../utils/validation';

const AdminLoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
  });
  const [touchedFields, setTouchedFields] = useState({
    email: false,
    password: false,
  });

  const { message } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { login } = useAuth();
  const {
    user,
    loading,
    error: apiError,
  } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(resetAuthState());
  }, [dispatch]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const emailError = validateEmail(formData.email);
    const passwordError = validateLoginPassword(formData.password);

    setFieldErrors({
      email: emailError || '',
      password: passwordError || '',
    });

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

    setTouchedFields({
      email: true,
      password: true,
    });

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

  const isSubmitDisabled =
    !formData.email ||
    !formData.password ||
    !!fieldErrors.email ||
    !!fieldErrors.password ||
    loading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-lg shadow-2xl border border-white/20 p-6 sm:p-8">
        <header className="mb-6">
          <Logo />
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-4 bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
            Admin Login
          </h2>
          <p className="text-gray-200 text-sm mt-2">
            Login to manage the system
          </p>
        </header>

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

        <div className="space-y-4">
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

          <div className="flex justify-between items-center text-sm">
            <Link
              to="/forgot-password"
              className="text-purple-300 hover:text-purple-200 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="button"
            disabled={isSubmitDisabled}
            onClick={handleSubmit}
            className={`w-full p-3 rounded-lg text-white font-medium transition-all duration-300 ${
              isSubmitDisabled
                ? 'bg-gray-500/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>
        </div>

        <p className="text-center mt-6 text-gray-200 text-sm">
          Not an admin?{' '}
          <Link
            to="/login"
            className="text-purple-300 hover:text-purple-200 transition-colors"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
