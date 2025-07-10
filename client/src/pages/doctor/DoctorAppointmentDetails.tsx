/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { completeAppointmentThunk } from '../../redux/thunks/doctorThunk';
import { DateUtils } from '../../utils/DateUtils';
import { MessageSquare, Video } from 'lucide-react';
import api from '../../services/api';
import VideoCallModal from '../../components/VideoCallModal';
import { useSocket } from '../../hooks/useSocket';

interface AppointmentPatient {
  _id: string;
  name?: string;
  profilePicture?: string;
}

interface AppointmentDoctor {
  _id: string;
  name: string;
  profilePicture?: string;
  speciality?: string[];
  qualifications?: string[];
  age?: number;
  gender?: string;
}

interface Prescription {
  _id: string;
  appointmentId: string;
  patientId: string | { _id: string; name: string };
  doctorId: string | { _id: string; name: string };
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    _id?: string;
  }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Appointment {
  _id: string;
  patientId: AppointmentPatient;
  doctorId: AppointmentDoctor;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'completed' | 'cancelled';
  isFreeBooking?: boolean;
  bookingTime?: string;
  createdAt?: string;
  updatedAt?: string;
  prescriptionId?: Prescription;
  prescription?: {
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    notes?: string;
  };
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface FormErrors {
  medications: Array<{ [key in keyof Medication]?: string }>;
  notes?: string;
}

const DoctorAppointmentDetails: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { socket, registerHandlers } = useSocket();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '', duration: '' },
  ]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({ medications: [{}] });
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [callerInfo, setCallerInfo] = useState<
    { callerId: string; callerRole: string } | undefined
  >(undefined);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId) return;
      try {
        setLoading(true);
        const response = await api.get(
          `/api/doctors/appointments/${appointmentId}`
        );
        const appointmentData = response.data;
        if (appointmentData.prescriptionId) {
          appointmentData.prescription = {
            medications: appointmentData.prescriptionId.medications.map(
              (med: any) => ({
                name: med.name,
                dosage: med.dosage,
                frequency: med.frequency,
                duration: med.duration,
              })
            ),
            notes: appointmentData.prescriptionId.notes,
          };
        }
        setAppointment(appointmentData);
        if (appointmentData.prescriptionId) {
          setMedications(
            appointmentData.prescriptionId.medications || [
              { name: '', dosage: '', frequency: '', duration: '' },
            ]
          );
          setNotes(appointmentData.prescriptionId.notes || '');
        }
      } catch {
        toast.error('Failed to fetch appointment details');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [appointmentId]);

  useEffect(() => {
    if (!socket || !appointment || !user?._id) return;

    const handlers = {
      onIncomingCall: (data: {
        appointmentId: string;
        callerId: string;
        callerRole: string;
      }) => {
        if (data.appointmentId === appointmentId) {
          setCallerInfo({
            callerId: data.callerId,
            callerRole: data.callerRole,
          });
          setIsVideoCallOpen(true);
          setIsCaller(false);
          toast.info(`Incoming call from ${data.callerRole}`);
        }
      },
      onCallAccepted: (data: { appointmentId: string; acceptorId: string }) => {
        if (data.appointmentId === appointmentId) {
          setIsVideoCallOpen(true);
          setIsCaller(true);
          toast.success('Call accepted');
        }
      },
      onCallRejected: (data: { appointmentId: string; rejectorId: string }) => {
        if (data.appointmentId === appointmentId) {
          setIsVideoCallOpen(false);
          setCallerInfo(undefined);
          toast.info('Call rejected');
        }
      },
    };

    registerHandlers(handlers);

    return () => {
      // Handlers are managed by SocketContext
    };
  }, [
    socket,
    appointment,
    appointmentId,
    user,
    registerHandlers,
  ]);

  const isWithinAppointmentTime = () => {
    if (!appointment) return false;
    const now = new Date();
    const startTime = new Date(
      `${appointment.date.split('T')[0]}T${appointment.startTime}`
    );
    const endTime = new Date(
      `${appointment.date.split('T')[0]}T${appointment.endTime}`
    );
    return (
      now >= startTime && now <= endTime && appointment.status === 'pending'
    );
  };

  const handleStartVideoCall = async () => {
    if (!appointment || !appointment.patientId._id || !user?._id) {
      toast.error(
        'Cannot start video call: Missing appointment or patient information'
      );
      return;
    }
    try {
      await socket?.emit('initiateVideoCall', {
        appointmentId,
        receiverId: appointment.patientId._id,
      });
      setIsVideoCallOpen(true);
      setIsCaller(true);
    } catch (error) {
      console.error('Failed to initiate video call:', error);
      toast.error('Failed to start video call');
    }
  };

  const handleOpenChat = () => {
    if (appointment?.patientId._id) {
      navigate(`/doctor/messages?thread=${appointment.patientId._id}`);
    } else {
      toast.error('Cannot open chat: Patient information missing');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = { medications: medications.map(() => ({})) };
    let isValid = true;

    medications.forEach((med, index) => {
      if (!med.name.trim()) {
        newErrors.medications[index].name = 'Medication name is required';
        isValid = false;
      }
      if (!med.dosage.trim()) {
        newErrors.medications[index].dosage = 'Dosage is required';
        isValid = false;
      }
      if (!med.frequency.trim()) {
        newErrors.medications[index].frequency = 'Frequency is required';
        isValid = false;
      }
      if (!med.duration.trim()) {
        newErrors.medications[index].duration = 'Duration is required';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '', frequency: '', duration: '' },
    ]);
    setErrors((prev) => ({ ...prev, medications: [...prev.medications, {}] }));
  };

  const handleMedicationChange = (
    index: number,
    field: keyof Medication,
    value: string
  ) => {
    const updatedMedications = [...medications];
    updatedMedications[index][field] = value;
    setMedications(updatedMedications);
    setErrors((prev) => {
      const newErrors = { ...prev, medications: [...prev.medications] };
      newErrors.medications[index] = {
        ...newErrors.medications[index],
        [field]: undefined,
      };
      return newErrors;
    });
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
    setErrors((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const handleSubmitPrescription = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!appointment || !user?._id) return;
    try {
      const prescription = { medications, notes: notes.trim() || undefined };
      await dispatch(
        completeAppointmentThunk({
          appointmentId: appointment._id,
          prescription,
        })
      ).unwrap();
      toast.success('Prescription created successfully');
      const response = await api.get(
        `/api/doctors/appointments/${appointmentId}`
      );
      const appointmentData = response.data;
      if (appointmentData.prescriptionId) {
        appointmentData.prescription = {
          medications: appointmentData.prescriptionId.medications.map(
            (med: any) => ({
              name: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration,
            })
          ),
          notes: appointmentData.prescriptionId.notes,
        };
      }
      setAppointment(appointmentData);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create prescription');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Appointment not found</h2>
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8">
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <VideoCallModal
        isOpen={isVideoCallOpen}
        onClose={() => {
          setIsVideoCallOpen(false);
          setCallerInfo(undefined);
        }}
        appointmentId={appointmentId || ''}
        userId={user?._id || ''}
        receiverId={appointment.patientId._id || ''}
        isCaller={isCaller}
        callerInfo={callerInfo}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl">
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="mb-4 text-white hover:text-blue-300 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Appointments
          </button>
          <h2 className="text-xl sm:text-2xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
            Appointment Details
          </h2>
          <div className="space-y-6">
            <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Appointment Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                <div>
                  <p className="text-sm text-gray-300">Patient</p>
                  <p className="font-medium">
                    {appointment.patientId.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Date</p>
                  <p className="font-medium">
                    {DateUtils.formatToLocal(appointment.date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Time</p>
                  <p className="font-medium">
                    {DateUtils.formatTimeToLocal(appointment.startTime)} -{' '}
                    {DateUtils.formatTimeToLocal(appointment.endTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Status</p>
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      appointment.status === 'completed'
                        ? 'bg-green-500/20 text-green-300'
                        : appointment.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {appointment.status.charAt(0).toUpperCase() +
                      appointment.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex gap-4">
                <button
                  onClick={handleOpenChat}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
                >
                  <MessageSquare className="w-5 h-5 text-white" />
                  <span className="text-white text-sm">Chat with Patient</span>
                </button>
                <button
                  onClick={handleStartVideoCall}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    !isWithinAppointmentTime() ||
                    appointment.status !== 'pending'
                  }
                  title={
                    !isWithinAppointmentTime()
                      ? 'Video call available during appointment time'
                      : appointment.status !== 'pending'
                        ? 'Video call only available for pending appointments'
                        : 'Start Video Call'
                  }
                >
                  <Video className="w-5 h-5 text-white" />
                  <span className="text-white text-sm">Start Video Call</span>
                </button>
              </div>
              {!isWithinAppointmentTime() &&
                appointment.status === 'pending' && (
                  <p className="text-yellow-300 text-sm text-center mt-4">
                    Video call will be available during your appointment time:
                    <br />
                    {DateUtils.formatTimeToLocal(appointment.startTime)} -{' '}
                    {DateUtils.formatTimeToLocal(appointment.endTime)}
                  </p>
                )}
            </div>

            <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {appointment.prescription
                  ? 'Prescription'
                  : 'Create Prescription'}
              </h3>
              {appointment.prescription ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm text-gray-300">Medications</h4>
                    {appointment.prescription.medications.map((med, index) => (
                      <div
                        key={index}
                        className="border-b border-white/20 py-2"
                      >
                        <p className="text-white">
                          <strong>Name:</strong> {med.name}
                        </p>
                        <p className="text-white">
                          <strong>Dosage:</strong> {med.dosage}
                        </p>
                        <p className="text-white">
                          <strong>Frequency:</strong> {med.frequency}
                        </p>
                        <p className="text-white">
                          <strong>Duration:</strong> {med.duration}
                        </p>
                      </div>
                    ))}
                  </div>
                  {appointment.prescription.notes && (
                    <div>
                      <h4 className="text-sm text-gray-300">
                        Additional Notes
                      </h4>
                      <p className="text-white">
                        {appointment.prescription.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : appointment.status === 'completed' ? (
                <p className="text-gray-200">
                  No prescription created for this appointment.
                </p>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm text-gray-300 mb-2">Medications</h4>
                    {medications.map((medication, index) => (
                      <div
                        key={index}
                        className="flex flex-col space-y-3 border-b border-white/20 pb-4 mb-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <input
                              type="text"
                              placeholder="Medication Name (e.g., Ibuprofen)"
                              className={`w-full p-2 bg-white/10 border ${
                                errors.medications[index]?.name
                                  ? 'border-red-500'
                                  : 'border-white/20'
                              } rounded-lg text-white placeholder-gray-400`}
                              value={medication.name}
                              onChange={(e) =>
                                handleMedicationChange(
                                  index,
                                  'name',
                                  e.target.value
                                )
                              }
                            />
                            {errors.medications[index]?.name && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.medications[index].name}
                              </p>
                            )}
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Dosage (e.g., 200mg)"
                              className={`w-full p-2 bg-white/10 border ${
                                errors.medications[index]?.dosage
                                  ? 'border-red-500'
                                  : 'border-white/20'
                              } rounded-lg text-white placeholder-gray-400`}
                              value={medication.dosage}
                              onChange={(e) =>
                                handleMedicationChange(
                                  index,
                                  'dosage',
                                  e.target.value
                                )
                              }
                            />
                            {errors.medications[index]?.dosage && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.medications[index].dosage}
                              </p>
                            )}
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Frequency (e.g., Twice daily)"
                              className={`w-full p-2 bg-white/10 border ${
                                errors.medications[index]?.frequency
                                  ? 'border-red-500'
                                  : 'border-white/20'
                              } rounded-lg text-white placeholder-gray-400`}
                              value={medication.frequency}
                              onChange={(e) =>
                                handleMedicationChange(
                                  index,
                                  'frequency',
                                  e.target.value
                                )
                              }
                            />
                            {errors.medications[index]?.frequency && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.medications[index].frequency}
                              </p>
                            )}
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Duration (e.g., 7 days)"
                              className={`w-full p-2 bg-white/10 border ${
                                errors.medications[index]?.duration
                                  ? 'border-red-500'
                                  : 'border-white/20'
                              } rounded-lg text-white placeholder-gray-400`}
                              value={medication.duration}
                              onChange={(e) =>
                                handleMedicationChange(
                                  index,
                                  'duration',
                                  e.target.value
                                )
                              }
                            />
                            {errors.medications[index]?.duration && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.medications[index].duration}
                              </p>
                            )}
                          </div>
                        </div>
                        {medications.length > 1 && (
                          <button
                            onClick={() => handleRemoveMedication(index)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remove Medication
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={handleAddMedication}
                      className="text-blue-300 hover:text-blue-200 text-sm"
                    >
                      + Add Another Medication
                    </button>
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-300 mb-2">
                      Additional Notes
                    </h4>
                    <textarea
                      placeholder="Enter any additional notes"
                      className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <button
                    onClick={handleSubmitPrescription}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                    disabled={appointment.status !== 'pending'}
                  >
                    Submit Prescription
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointmentDetails;
