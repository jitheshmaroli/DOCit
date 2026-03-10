/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  completeAppointmentThunk,
  cancelAppointmentThunk,
} from '../../redux/thunks/doctorThunk';
import { DateUtils } from '../../utils/DateUtils';
import {
  MessageSquare,
  Video,
  ArrowLeft,
  Pill,
  Plus,
  X,
  Loader2,
  Clock,
  FileText,
  Download,
} from 'lucide-react';
import VideoCallModal from '../../components/VideoCallModal';
import CancelAppointmentModal from '../../components/CancelAppointmentModal';
import { useSocket } from '../../hooks/useSocket';
import {
  validateMedicationName,
  validateDosage,
  validateFrequency,
  validateDuration,
} from '../../utils/validation';
import { getAppointmentById } from '../../services/doctorService';
import {
  Appointment,
  FormErrors,
  Medication,
} from '../../types/appointmentTypes';
import { showError, showInfo, showSuccess } from '../../utils/toastConfig';

// helpers
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending: 'badge-warning',
    completed: 'badge-success',
    cancelled: 'badge-error',
  };
  return (
    <span className={`badge ${map[status] || 'badge-neutral'} capitalize`}>
      {status}
    </span>
  );
};

const InfoRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <p className="text-xs text-text-muted mb-0.5">{label}</p>
    <div className="text-sm font-medium text-text-primary">{children}</div>
  </div>
);

const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="card overflow-hidden">
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-surface-border">
      {icon && <span className="text-primary-500">{icon}</span>}
      <h3 className="font-display font-bold text-text-primary">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// component
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
  >();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [showFullNotes, setShowFullNotes] = useState(false);

  // fetch
  useEffect(() => {
    const fetch = async () => {
      if (!appointmentId) return;
      try {
        setLoading(true);
        const data = await getAppointmentById(appointmentId);
        if (data.prescriptionId) {
          data.prescription = {
            medications: data.prescriptionId.medications.map((m: any) => ({
              name: m.name,
              dosage: m.dosage,
              frequency: m.frequency,
              duration: m.duration,
            })),
            notes: data.prescriptionId.notes,
            pdfUrl: data.prescriptionId.pdfUrl,
          };
          setMedications(
            data.prescriptionId.medications || [
              { name: '', dosage: '', frequency: '', duration: '' },
            ]
          );
          setNotes(data.prescriptionId.notes || '');
        }
        setAppointment(data);
      } catch {
        showError('Failed to fetch appointment details');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [appointmentId]);

  // socket
  useEffect(() => {
    if (!socket || !appointment || !user?._id) return;
    registerHandlers({
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
          showInfo(`Incoming call from ${data.callerRole}`);
        }
      },
      onCallAccepted: (data: { appointmentId: string }) => {
        if (data.appointmentId === appointmentId) {
          setIsVideoCallOpen(true);
          setIsCaller(true);
        }
      },
      onCallRejected: (data: { appointmentId: string }) => {
        if (data.appointmentId === appointmentId) {
          setIsVideoCallOpen(false);
          setCallerInfo(undefined);
          showInfo('Call rejected');
        }
      },
    });
  }, [socket, appointment, appointmentId, user, registerHandlers]);

  // time helpers
  const isWithinAppointmentTime = useCallback(() => {
    if (!appointment) return false;
    const now = new Date();
    const start = new Date(
      `${appointment.date.split('T')[0]}T${appointment.startTime}`
    );
    const end = new Date(
      `${appointment.date.split('T')[0]}T${appointment.endTime}`
    );
    return now >= start && now <= end && appointment.status === 'pending';
  }, [appointment]);

  const isPastAppointment = useCallback(() => {
    if (!appointment) return false;
    const end = new Date(
      `${appointment.date.split('T')[0]}T${appointment.endTime}`
    );
    return new Date() > end && appointment.status === 'pending';
  }, [appointment]);

  const isFutureAppointment = useCallback(() => {
    if (!appointment) return false;
    const start = new Date(
      `${appointment.date.split('T')[0]}T${appointment.startTime}`
    );
    return new Date() < start && appointment.status === 'pending';
  }, [appointment]);

  // actions
  const handleStartVideoCall = async () => {
    if (!appointment?.patientId._id || !user?._id) {
      showError('Missing appointment info');
      return;
    }
    try {
      await socket?.emit('initiateVideoCall', {
        appointmentId,
        receiverId: appointment.patientId._id,
      });
      setIsVideoCallOpen(true);
      setIsCaller(true);
    } catch {
      showError('Failed to start video call');
    }
  };

  const handleOpenChat = () => {
    if (appointment?.patientId._id)
      navigate(`/doctor/messages?thread=${appointment.patientId._id}`);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = { medications: medications.map(() => ({})) };
    let valid = true;
    medications.forEach((med, i) => {
      const ne = newErrors.medications[i];
      const check = (
        fn: (v: string) => string | undefined,
        key: keyof Medication
      ) => {
        const err = fn(med[key]);
        if (err) {
          ne[key] = err;
          valid = false;
        }
      };
      check(validateMedicationName, 'name');
      check(validateDosage, 'dosage');
      check(validateFrequency, 'frequency');
      check(validateDuration, 'duration');
    });
    setErrors(newErrors);
    return valid;
  };

  const handleMedicationChange = (
    index: number,
    field: keyof Medication,
    value: string
  ) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
    setErrors((prev) => {
      const m = [...prev.medications];
      m[index] = { ...m[index], [field]: undefined };
      return { ...prev, medications: m };
    });
  };

  const handleAddMedication = () => {
    setMedications((p) => [
      ...p,
      { name: '', dosage: '', frequency: '', duration: '' },
    ]);
    setErrors((p) => ({ ...p, medications: [...p.medications, {}] }));
  };

  const handleRemoveMedication = (i: number) => {
    setMedications((p) => p.filter((_, idx) => idx !== i));
    setErrors((p) => ({
      ...p,
      medications: p.medications.filter((_, idx) => idx !== i),
    }));
  };

  const handleSubmitPrescription = async () => {
    if (!validateForm()) {
      showError('Please fix all form errors');
      return;
    }
    if (!appointment || !user?._id) return;
    await dispatch(
      completeAppointmentThunk({
        appointmentId: appointment._id,
        prescription: { medications, notes: notes.trim() || undefined },
      })
    ).unwrap();
    const data = await getAppointmentById(appointmentId!);
    if (data.prescriptionId) {
      data.prescription = {
        medications: data.prescriptionId.medications.map((m: any) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
        })),
        notes: data.prescriptionId.notes,
        pdfUrl: data.prescriptionId.pdfUrl,
      };
    }
    showSuccess('Prescription created successfully');
    setAppointment(data);
  };

  const handleCancelAppointment = async (reason: string) => {
    if (!appointmentId || !user?._id) {
      showError('User not authenticated');
      return;
    }
    try {
      await dispatch(
        cancelAppointmentThunk({ appointmentId, cancellationReason: reason })
      ).unwrap();
      showSuccess('Appointment cancelled successfully');
      setAppointment((p) =>
        p ? { ...p, status: 'cancelled', cancellationReason: reason } : p
      );
    } catch {
      showError('Failed to cancel appointment');
    }
  };

  // loading / not-found states
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 size={28} className="animate-spin text-primary-400" />
        <p className="text-sm text-text-muted">
          Loading appointment details...
        </p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-text-secondary font-medium">
          Appointment not found.
        </p>
        <button
          onClick={() => navigate('/doctor/appointments')}
          className="btn-secondary"
        >
          Back to Appointments
        </button>
      </div>
    );
  }

  const canCreatePrescription =
    (isWithinAppointmentTime() || isPastAppointment()) &&
    appointment.status === 'pending';

  return (
    <>
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
      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelAppointment}
        appointmentId={appointmentId || ''}
      />

      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
        {/* ── Back + title ── */}
        <div className="page-header">
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="btn-ghost flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft size={16} /> Back to Appointments
          </button>
        </div>

        {/* ── Appointment info ── */}
        <Section title="Appointment Information" icon={<Clock size={16} />}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <InfoRow label="Patient">
              {appointment.patientId.name || 'N/A'}
            </InfoRow>
            <InfoRow label="Date">
              {DateUtils.formatToLocal(appointment.date)}
            </InfoRow>
            <InfoRow label="Time">
              {DateUtils.formatTimeToLocal(appointment.startTime)} –{' '}
              {DateUtils.formatTimeToLocal(appointment.endTime)}
            </InfoRow>
            <InfoRow label="Status">
              <StatusBadge status={appointment.status} />
            </InfoRow>
            {appointment.status === 'cancelled' &&
              appointment.cancellationReason && (
                <div className="col-span-2 sm:col-span-4">
                  <InfoRow label="Cancellation Reason">
                    {appointment.cancellationReason}
                  </InfoRow>
                </div>
              )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button onClick={handleOpenChat} className="btn-secondary text-sm">
              <MessageSquare size={15} /> Chat with Patient
            </button>
            <button
              onClick={handleStartVideoCall}
              disabled={
                !isWithinAppointmentTime() || appointment.status !== 'pending'
              }
              title={
                !isWithinAppointmentTime()
                  ? 'Available during appointment time'
                  : appointment.status !== 'pending'
                    ? 'Only for pending appointments'
                    : 'Start Video Call'
              }
              className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Video size={15} /> Start Video Call
            </button>
            {appointment.status === 'pending' && isFutureAppointment() && (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="btn-danger text-sm ml-auto"
              >
                Cancel Appointment
              </button>
            )}
          </div>

          {!isWithinAppointmentTime() && appointment.status === 'pending' && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mt-3 flex items-center gap-2">
              <Clock size={13} />
              Video call available during appointment:{' '}
              {DateUtils.formatTimeToLocal(appointment.startTime)} –{' '}
              {DateUtils.formatTimeToLocal(appointment.endTime)}
            </p>
          )}
        </Section>

        {/* ── Prescription create / view ── */}
        {appointment.status !== 'cancelled' && (
          <Section
            title={
              canCreatePrescription ? 'Create Prescription' : 'Prescription'
            }
            icon={<FileText size={16} />}
          >
            {canCreatePrescription ? (
              <div className="space-y-5">
                {/* Medications */}
                <div className="space-y-4">
                  {medications.map((med, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-surface-border bg-surface-bg space-y-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                          <Pill size={12} /> Medication {i + 1}
                        </span>
                        {medications.length > 1 && (
                          <button
                            onClick={() => handleRemoveMedication(i)}
                            className="p-1 text-text-muted hover:text-error rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(
                          [
                            'name',
                            'dosage',
                            'frequency',
                            'duration',
                          ] as (keyof Medication)[]
                        ).map((field) => (
                          <div key={field}>
                            <label className="label mb-1 capitalize">
                              {field === 'name' ? 'Medication Name' : field}
                            </label>
                            <input
                              type="text"
                              value={med[field]}
                              onChange={(e) =>
                                handleMedicationChange(i, field, e.target.value)
                              }
                              placeholder={
                                field === 'name'
                                  ? 'e.g. Ibuprofen'
                                  : field === 'dosage'
                                    ? 'e.g. 200mg'
                                    : field === 'frequency'
                                      ? 'e.g. Twice daily'
                                      : 'e.g. 7 days'
                              }
                              className={`input ${errors.medications[i]?.[field] ? 'input-error' : ''}`}
                            />
                            {errors.medications[i]?.[field] && (
                              <p className="error-text mt-1">
                                {errors.medications[i][field]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAddMedication}
                  className="btn-ghost text-sm text-primary-600 hover:text-primary-700"
                >
                  <Plus size={14} /> Add Another Medication
                </button>

                {/* Notes */}
                <div>
                  <label className="label mb-1">Additional Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any additional notes..."
                    rows={3}
                    className="input resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmitPrescription}
                  className="btn-primary"
                >
                  <FileText size={15} /> Submit Prescription
                </button>
              </div>
            ) : appointment.prescription ? (
              <div className="space-y-4">
                {/* Medications list */}
                <div className="space-y-3">
                  {appointment.prescription.medications.map((med, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-surface-border bg-surface-bg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Pill size={13} className="text-primary-500" />
                        <span className="font-semibold text-text-primary text-sm">
                          {med.name}
                        </span>
                        <span className="badge badge-primary ml-auto">
                          {med.dosage}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <InfoRow label="Frequency">{med.frequency}</InfoRow>
                        <InfoRow label="Duration">{med.duration}</InfoRow>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {appointment.prescription.notes && (
                  <div className="p-3.5 bg-surface-muted rounded-xl border border-surface-border">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                      Notes
                    </p>
                    <p className="text-sm text-text-secondary">
                      {showFullNotes ||
                      appointment.prescription.notes.length <= 100
                        ? appointment.prescription.notes
                        : `${appointment.prescription.notes.substring(0, 100)}...`}
                    </p>
                    {appointment.prescription.notes.length > 100 && (
                      <button
                        onClick={() => setShowFullNotes((p) => !p)}
                        className="text-xs text-primary-600 hover:underline mt-1"
                      >
                        {showFullNotes ? 'Show Less' : 'Show More'}
                      </button>
                    )}
                  </div>
                )}

                {/* PDF */}
                {appointment.prescription.pdfUrl && (
                  <a
                    href={appointment.prescription.pdfUrl}
                    download
                    className="btn-secondary text-sm inline-flex"
                  >
                    <Download size={14} /> Download Prescription PDF
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-muted">
                {appointment.status === 'completed'
                  ? 'No prescription was created for this appointment.'
                  : 'Prescription creation is available only during or after the appointment time.'}
              </p>
            )}
          </Section>
        )}
      </div>
    </>
  );
};

export default DoctorAppointmentDetails;
