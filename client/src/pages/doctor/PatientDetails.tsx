import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Patient, Prescription } from '../../types/authTypes';
import { DateUtils } from '../../utils/DateUtils';
import Pagination from '../../components/common/Pagination';
import { getPatientAppointments } from '../../services/doctorService';
import { useAppSelector } from '../../redux/hooks';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import BackButton from '../../components/common/BackButton';
import { ITEMS_PER_PAGE } from '../../utils/constants';
import { Download, Pill, User, Phone, MapPin } from 'lucide-react';

interface Appointment {
  _id: string;
  patientId: { _id: string; name: string; profilePicture?: string };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  isFreeBooking?: boolean;
  prescription?: Prescription;
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending: 'badge-warning',
    completed: 'badge-success',
    cancelled: 'badge-error',
  };
  return (
    <span className={`badge ${map[status] || 'badge-neutral'} capitalize`}>
      {status || 'Pending'}
    </span>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-bg border border-surface-border">
    <span className="text-primary-400 mt-0.5">{icon}</span>
    <div>
      <p className="text-xs text-text-muted mb-0.5">{label}</p>
      <p className="text-sm font-medium text-text-primary">{value}</p>
    </div>
  </div>
);

const PatientDetails: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'medicalHistory'>(
    'profile'
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);
  const [showFullNotes, setShowFullNotes] = useState(false);

  useEffect(() => {
    const fetchPatient = async () => {
      if (!patientId) return;
      try {
        setLoading(true);
        const response = await api.get(`/api/user/${patientId}`);
        setPatient(response.data);
      } catch {
        console.error('Failed to fetch patient details');
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [patientId]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!patientId || !user?._id) return;
      try {
        setLoading(true);
        const response = await getPatientAppointments(
          patientId,
          user._id,
          currentPage,
          ITEMS_PER_PAGE
        );
        setAppointments(response.appointments || []);
        setTotalItems(response.totalItems || 0);
      } catch {
        console.error('Failed to fetch appointments');
      } finally {
        setLoading(false);
      }
    };
    if (activeTab === 'medicalHistory') fetchAppointments();
  }, [patientId, user?._id, currentPage, activeTab]);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <>
      {/* Prescription Modal */}
      <Modal
        isOpen={!!selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        title="Prescription Details"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            {selectedPrescription?.pdfUrl ? (
              <a
                href={selectedPrescription.pdfUrl}
                download
                className="btn-primary text-sm"
              >
                <Download size={14} /> Download PDF
              </a>
            ) : (
              <span />
            )}
            <button
              onClick={() => setSelectedPrescription(null)}
              className="btn-secondary text-sm"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedPrescription && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Medications
            </h4>
            <div className="space-y-3">
              {selectedPrescription.medications?.map((med, i) => (
                <div key={i} className="card p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Pill size={14} className="text-primary-500" />
                    <span className="font-semibold text-text-primary text-sm">
                      {med.name}
                    </span>
                    <span className="badge badge-primary ml-auto">
                      {med.dosage}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-text-muted">Frequency</p>
                      <p className="font-medium text-text-secondary">
                        {med.frequency}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Duration</p>
                      <p className="font-medium text-text-secondary">
                        {med.duration}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {selectedPrescription.notes && (
              <div className="p-3.5 bg-surface-muted rounded-xl border border-surface-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                  Notes
                </p>
                <p className="text-sm text-text-secondary">
                  {showFullNotes || selectedPrescription.notes.length <= 100
                    ? selectedPrescription.notes
                    : `${selectedPrescription.notes.substring(0, 100)}...`}
                </p>
                {selectedPrescription.notes.length > 100 && (
                  <button
                    onClick={() => setShowFullNotes((p) => !p)}
                    className="text-xs text-primary-600 hover:underline mt-1"
                  >
                    {showFullNotes ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="page-header">
          <div>
            <BackButton />
            <h1 className="page-title mt-2">Patient Details</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="card overflow-hidden">
          <div className="flex border-b border-surface-border">
            {(['profile', 'medicalHistory'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3.5 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-text-muted hover:text-text-secondary'
                }`}
              >
                {tab === 'profile' ? 'Profile' : 'Medical History'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* ── Profile tab ── */}
              {activeTab === 'profile' && patient && (
                <div className="p-6">
                  {/* Avatar + name */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6 pb-6 border-b border-surface-border">
                    {patient.profilePicture ? (
                      <img
                        src={patient.profilePicture}
                        alt={patient.name}
                        className="w-20 h-20 rounded-2xl object-cover border border-surface-border shadow-card"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600">
                        {patient.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-text-primary">
                        {patient.name}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {patient.email}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`badge ${patient.isBlocked ? 'badge-error' : 'badge-success'}`}
                        >
                          {patient.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                        <span
                          className={`badge ${patient.isSubscribed ? 'badge-primary' : 'badge-neutral'}`}
                        >
                          {patient.isSubscribed
                            ? 'Subscribed'
                            : 'Not Subscribed'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow
                      icon={<Phone size={14} />}
                      label="Phone"
                      value={patient.phone || 'N/A'}
                    />
                    <InfoRow
                      icon={<User size={14} />}
                      label="Age"
                      value={patient.age ? `${patient.age} years` : 'N/A'}
                    />
                    <InfoRow
                      icon={<User size={14} />}
                      label="Gender"
                      value={patient.gender || 'N/A'}
                    />
                    <InfoRow
                      icon={<MapPin size={14} />}
                      label="Address"
                      value={
                        patient.address
                          ? `${patient.address}${patient.pincode ? `, ${patient.pincode}` : ''}`
                          : 'N/A'
                      }
                    />
                  </div>
                </div>
              )}

              {/* ── Medical history tab ── */}
              {activeTab === 'medicalHistory' && (
                <div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-surface-border bg-surface-bg">
                          <th className="th text-left">Date</th>
                          <th className="th text-left">Time</th>
                          <th className="th text-left">Type</th>
                          <th className="th text-left">Status</th>
                          <th className="th text-left">Prescription</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {appointments.length > 0 ? (
                          appointments.map((appt) => (
                            <tr key={appt._id} className="tr">
                              <td className="td">
                                {DateUtils.formatToLocal(appt.date)}
                              </td>
                              <td className="td">
                                {DateUtils.formatTimeToLocal(appt.startTime)} –{' '}
                                {DateUtils.formatTimeToLocal(appt.endTime)}
                              </td>
                              <td className="td">
                                <span
                                  className={`badge ${appt.isFreeBooking ? 'badge-neutral' : 'badge-primary'}`}
                                >
                                  {appt.isFreeBooking ? 'Free' : 'Subscribed'}
                                </span>
                              </td>
                              <td className="td">
                                <StatusBadge status={appt.status} />
                              </td>
                              <td className="td">
                                {appt.status === 'completed' &&
                                appt.prescription ? (
                                  <button
                                    onClick={() => {
                                      setSelectedPrescription(
                                        appt.prescription!
                                      );
                                      setShowFullNotes(false);
                                    }}
                                    className="btn-primary text-xs px-3 py-1.5"
                                  >
                                    View
                                  </button>
                                ) : (
                                  'N/A'
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="td text-center text-text-muted py-10"
                            >
                              No medical history found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-surface-border">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default PatientDetails;
