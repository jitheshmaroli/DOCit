import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/Login';
import SignupPage from './pages/public/Signup';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import PatientLayout from './layouts/PatientLayout';
import FindDoctor from './pages/patient/FindDoctor';
import DoctorLayout from './layouts/DoctorLayout';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import NotFoundPage from './pages/public/NotFoundPage';
import AdminLayout from './layouts/AdminLayout';
import ManageDoctors from './pages/admin/ManageDoctors';
import ManagePatients from './pages/admin/ManagePatients';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProfilePage from './pages/patient/ProfilePage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import ProtectedRoute from './components/layout/ProtectionRoute';
import DoctorProfilePage from './pages/doctor/DoctorProfilePage';
import DoctorAvailability from './pages/doctor/DoctorAvailabilty';
import BookAppointment from './pages/patient/BookAppointment';

const App = () => {
 
  return (
    <BrowserRouter>
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
            <Route path="book-appointment/:doctorId" element={<BookAppointment />} />
          </Route>
        </Route>

        {/* Doctor protected routes */}
        <Route element={<ProtectedRoute roles={['doctor']} />}>
          <Route path="/doctor" element={<DoctorLayout />}>
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="profile" element={<DoctorProfilePage />} />
            <Route path="availability" element={<DoctorAvailability />} />
          </Route>
        </Route>

        {/* Admin protected routes */}
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="manage-doctors" element={<ManageDoctors />} />
            <Route path="manage-patients" element={<ManagePatients />} />
          </Route>
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
