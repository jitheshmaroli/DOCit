import React, { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { clearError as clearDoctorError } from '../redux/slices/doctorSlice';
import { clearError as clearPatientError } from '../redux/slices/patientSlice';
// Add other slice clears as needed (e.g., authSlice if you have one)

const ToastManager: React.FC = () => {
  const dispatch = useAppDispatch();

  // Doctor slice errors
  const { error: doctorError } = useAppSelector((state) => state.doctors);
  useEffect(() => {
    if (doctorError) {
      toast.error(doctorError, {
        toastId: 'doctor-error', // Unique ID to prevent duplicates
        autoClose: 3000,
      });
      dispatch(clearDoctorError());
    }
  }, [doctorError, dispatch]);

  // Patient slice errors
  const { error: patientError } = useAppSelector((state) => state.patient);
  useEffect(() => {
    if (patientError) {
      toast.error(patientError, {
        toastId: 'patient-error', // Unique ID
        autoClose: 3000,
      });
      dispatch(clearPatientError());
    }
  }, [patientError, dispatch]);

  // Add similar for other slices (e.g., auth errors, etc.)
  // You can also add success toasts here if needed, e.g., from subscriptionStatus

  return null; // This is a headless component
};

export default ToastManager;
