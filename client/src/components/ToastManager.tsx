import React, { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { clearError as clearDoctorError } from '../redux/slices/doctorSlice';
import { clearError as clearPatientError } from '../redux/slices/patientSlice';

const ToastManager: React.FC = () => {
  const dispatch = useAppDispatch();

  const { error: doctorError } = useAppSelector((state) => state.doctors);
  useEffect(() => {
    if (doctorError) {
      toast.error(doctorError, { toastId: 'doctor-error', autoClose: 3000 });
      dispatch(clearDoctorError());
    }
  }, [doctorError, dispatch]);

  const { error: patientError } = useAppSelector((state) => state.patient);
  useEffect(() => {
    if (patientError) {
      toast.error(patientError, { toastId: 'patient-error', autoClose: 3000 });
      dispatch(clearPatientError());
    }
  }, [patientError, dispatch]);

  return null;
};

export default ToastManager;
