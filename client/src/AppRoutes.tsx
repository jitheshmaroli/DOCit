import { Route, Routes, useNavigate } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/Login';
import SignupPage from './pages/public/Signup';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import PatientLayout from './layouts/PatientLayout';
import FindDoctor from './pages/patient/FindDoctor';
import DoctorDetails from './pages/patient/DoctorDetails';
import DoctorLayout from './layouts/DoctorLayout';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import NotFoundPage from './pages/public/NotFoundPage';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProfilePage from './pages/patient/ProfilePage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import ProtectedRoute from './components/layout/ProtectionRoute';
import DoctorProfilePage from './pages/doctor/DoctorProfilePage';
import DoctorAvailability from './pages/doctor/DoctorAvailability';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import AdminAppointments from './pages/admin/AdminAppointments';
import DoctorPlans from './pages/doctor/DoctorPlans';
import AdminPlanManagement from './pages/admin/AdminPlanManagement';
import AdminSpecialityManagement from './pages/admin/AdminSpecialityManagement';
import AdminManagePatients from './pages/admin/AdminManagePatients';
import AdminManageDoctors from './pages/admin/AdminManageDoctors';
import AppointmentDetails from './pages/patient/AppointmentDetails';
import Messages from './pages/doctor/Messages';
import PatientDetails from './pages/doctor/PatientDetails';
import { useAppDispatch } from './redux/hooks';
import { useEffect } from 'react';
import { clearUser } from './redux/slices/authSlice';
import DoctorAppointmentDetails from './pages/doctor/DoctorAppointmentDetails';

const AppRoutes = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleLogout = () => {
      console.log('Handling auth:logout event');
      dispatch(clearUser());
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [dispatch, navigate]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Patient protected routes */}
      <Route element={<ProtectedRoute roles={['patient']} />}>
        <Route path="/patient" element={<PatientLayout />}>
          <Route path="find-doctor" element={<FindDoctor />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="doctors/:doctorId" element={<DoctorDetails />} />
          <Route
            path="appointment/:appointmentId"
            element={<AppointmentDetails />}
          />
        </Route>
      </Route>

      {/* Doctor protected routes */}
      <Route element={<ProtectedRoute roles={['doctor']} />}>
        <Route path="/doctor" element={<DoctorLayout />}>
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="profile" element={<DoctorProfilePage />} />
          <Route path="availability" element={<DoctorAvailability />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="messages" element={<Messages />} />
          <Route path="plans" element={<DoctorPlans />} />
          <Route path="patient/:patientId" element={<PatientDetails />} />
          <Route
            path="appointment/:appointmentId"
            element={<DoctorAppointmentDetails />}
          />
        </Route>
      </Route>

      {/* Admin protected routes */}
      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="manage-doctors" element={<AdminManageDoctors />} />
          <Route path="manage-patients" element={<AdminManagePatients />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="plan-management" element={<AdminPlanManagement />} />
          <Route path="specialities" element={<AdminSpecialityManagement />} />
        </Route>
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
