/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { completeAppointmentThunk } from '../../redux/thunks/doctorThunk';
import { DateUtils } from '../../utils/DateUtils';
import { MessageSquare, Video } from 'lucide-react';
import { SocketManager } from '../../services/SocketManager';
import VideoCallModal from '../../components/VideoCallModal';
import api from '../../services/api';

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
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '', duration: '' },
  ]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({ medications: [{}] });
  const socketManager = SocketManager.getInstance();

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId) return;
      try {
        setLoading(true);
        const response = await api.get(
          `/api/doctors/appointments/${appointmentId}`
        );
        console.log('appointment response:', response.data);
        // Transform the response to match the expected Appointment interface
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
    socketManager.registerHandlers({
      onReceiveOffer: (data) => {
        if (data.appointmentId === appointmentId && user?._id) {
          setShowVideoCallModal(true);
        }
      },
      onCallEnded: (data) => {
        if (data.appointmentId === appointmentId) {
          setShowVideoCallModal(false);
        }
      },
    });
  }, [appointmentId, user?._id, socketManager]);

  const handleStartVideoCall = async () => {
    if (!appointment || !user?._id) {
      toast.error('User or appointment not found');
      return;
    }
    const now = new Date();
    const startTime = new Date(
      `${appointment.date.split('T')[0]}T${appointment.startTime}`
    );
    const endTime = new Date(
      `${appointment.date.split('T')[0]}T${appointment.endTime}`
    );
    if (now < startTime || now > endTime || appointment.status !== 'pending') {
      toast.error('Video calls are only available during the appointment time');
      return;
    }
    if (!socketManager.isConnected()) {
      try {
        await socketManager.connect(user._id);
      } catch (error) {
        console.error('Failed to connect socket for video call:', error);
        toast.error('Failed to initiate video call due to connection issues');
        return;
      }
    }
    setShowVideoCallModal(true);
  };

  const handleOpenChat = () => {
    navigate(`/doctor/messages?thread=${appointment?.patientId._id}`);
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
    if (!appointment) return;
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
      toast.error(error || 'Failed to create prescription');
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      {showVideoCallModal && appointment && (
        <VideoCallModal
          key={appointment._id}
          appointment={appointment}
          isCaller={true}
          user={user}
          onClose={() => setShowVideoCallModal(false)}
          patientName={appointment.patientId.name}
        />
      )}
      <div className="bg-white/10 backdrop-blur-lg p-4 sm:p-6 rounded-2xl border border-white/20 shadow-xl">
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
        {loading ? (
          <div className="text-center text-gray-200">Loading...</div>
        ) : appointment ? (
          <div className="space-y-6">
            {/* Appointment Details Section */}
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
                    {appointment.status || 'Pending'}
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
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                  disabled={
                    !(
                      new Date() >=
                        new Date(
                          `${appointment.date.split('T')[0]}T${appointment.startTime}`
                        ) &&
                      new Date() <=
                        new Date(
                          `${appointment.date.split('T')[0]}T${appointment.endTime}`
                        ) &&
                      appointment.status === 'pending'
                    )
                  }
                >
                  <Video className="w-5 h-5 text-white" />
                  <span className="text-white text-sm">Start Video Call</span>
                </button>
              </div>
            </div>

            {/* Prescription Section */}
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
                              } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
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
                              <p className="text-red-500 text-sm mt-1">
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
                              } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
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
                              <p className="text-red-500 text-sm mt-1">
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
                              } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
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
                              <p className="text-red-500 text-sm mt-1">
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
                              } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
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
                              <p className="text-red-500 text-sm mt-1">
                                {errors.medications[index].duration}
                              </p>
                            )}
                          </div>
                        </div>
                        {medications.length > 1 && (
                          <button
                            onClick={() => handleRemoveMedication(index)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Remove Medication
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={handleAddMedication}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
                    >
                      Add Another Medication
                    </button>
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-300 mb-2">
                      Additional Notes
                    </h4>
                    <textarea
                      placeholder="Enter any additional notes or instructions"
                      className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 h-32"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => {
                        setMedications([
                          { name: '', dosage: '', frequency: '', duration: '' },
                        ]);
                        setNotes('');
                        setErrors({ medications: [{}] });
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleSubmitPrescription}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300"
                    >
                      Submit Prescription
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-200">
            No appointment details found.
          </p>
        )}
      </div>
    </>
  );
};

export default DoctorAppointmentDetails;
