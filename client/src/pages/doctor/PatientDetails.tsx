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

    if (activeTab === 'medicalHistory') {
      fetchAppointments();
    }
  }, [patientId, user?._id, currentPage, activeTab]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewPrescription = (prescription: Prescription | undefined) => {
    if (prescription) {
      setSelectedPrescription(prescription);
      setShowFullNotes(false);
    }
  };

  const toggleNotes = () => {
    setShowFullNotes(!showFullNotes);
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <>
      <Modal
        isOpen={!!selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        title="Prescription Details"
        footer={
          selectedPrescription?.pdfUrl ? (
            <>
              <a
                href={selectedPrescription.pdfUrl}
                download
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
              >
                Download PDF
              </a>
              <button
                onClick={() => setSelectedPrescription(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                Close
              </button>
            </>
          ) : (
            <button
              onClick={() => setSelectedPrescription(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
            >
              Close
            </button>
          )
        }
      >
        {selectedPrescription && (
          <div className="space-y-4 text-white">
            <div>
              <h4 className="text-sm text-gray-300">Medications</h4>
              {selectedPrescription.medications?.map((med, index) => (
                <div key={index} className="border-b border-white/20 py-2">
                  <p>
                    <strong>Name:</strong> {med.name}
                  </p>
                  <p>
                    <strong>Dosage:</strong> {med.dosage}
                  </p>
                  <p>
                    <strong>Frequency:</strong> {med.frequency}
                  </p>
                  <p>
                    <strong>Duration:</strong> {med.duration}
                  </p>
                </div>
              ))}
            </div>
            {selectedPrescription.notes && (
              <div>
                <h4 className="text-sm text-gray-300">Notes</h4>
                <p className="text-white break-words max-w-full">
                  {showFullNotes
                    ? selectedPrescription.notes
                    : selectedPrescription.notes.length > 100
                      ? `${selectedPrescription.notes.substring(0, 100)}...`
                      : selectedPrescription.notes}
                </p>
                {selectedPrescription.notes.length > 100 && (
                  <button
                    onClick={toggleNotes}
                    className="text-blue-300 hover:text-blue-200 text-sm mt-2"
                  >
                    {showFullNotes ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
      <div className="bg-white/10 backdrop-blur-lg p-4 sm:p-6 rounded-2xl border border-white/20 shadow-xl">
        <BackButton />
        <h2 className="text-xl sm:text-2xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
          Patient Details
        </h2>
        <div className="mb-6">
          <div className="flex border-b border-white/20">
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'profile' ? 'text-white border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'medicalHistory' ? 'text-white border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('medicalHistory')}
            >
              Medical History
            </button>
          </div>
        </div>
        {loading ? (
          <div className="text-center text-gray-200">Loading...</div>
        ) : (
          <>
            {activeTab === 'profile' && patient && (
              <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 p-6">
                <div className="flex flex-col items-center mb-6">
                  {patient.profilePicture ? (
                    <img
                      src={patient.profilePicture}
                      alt={patient.name}
                      className="w-24 h-24 rounded-full object-cover border-2 border-white/50"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl text-white">
                      {patient.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h3 className="mt-4 text-xl font-bold text-white">
                    {patient.name}
                  </h3>
                  <p className="text-gray-300">{patient.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-white">
                  <div>
                    <p className="text-sm text-gray-300">Phone</p>
                    <p className="font-medium">{patient.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Age</p>
                    <p className="font-medium">{patient.age || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Gender</p>
                    <p className="font-medium">{patient.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Status</p>
                    <p className="font-medium">
                      {patient.isBlocked ? (
                        <span className="text-red-400">Blocked</span>
                      ) : (
                        <span className="text-green-400">Active</span>
                      )}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-300">Address</p>
                    <p className="font-medium">{patient.address || 'N/A'}</p>
                    {patient.pincode && (
                      <p className="text-sm text-gray-300">
                        Pincode: {patient.pincode}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-300">Subscription</p>
                    <p className="font-medium">
                      {patient.isSubscribed ? (
                        <span className="text-green-400">Subscribed</span>
                      ) : (
                        <span className="text-yellow-400">Not Subscribed</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'medicalHistory' && (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white/20 backdrop-blur-lg border border-white/20 rounded-lg">
                  <thead>
                    <tr className="bg-white/10 border-bottom border-white/20">
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                        Prescription
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/20">
                    {appointments.length > 0 ? (
                      appointments.map((appt) => (
                        <tr
                          key={appt._id}
                          className="hover:bg-white/30 transition-all duration-300"
                        >
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                            {DateUtils.formatToLocal(appt.date)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                            {DateUtils.formatTimeToLocal(appt.startTime)} -{' '}
                            {DateUtils.formatTimeToLocal(appt.endTime)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                            {appt.isFreeBooking ? 'Free Booking' : 'Subscribed'}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                appt.status === 'completed'
                                  ? 'bg-green-500/20 text-green-300'
                                  : appt.status === 'pending'
                                    ? 'bg-yellow-500/20 text-yellow-300'
                                    : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {appt.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                            {appt.status === 'completed' &&
                            appt.prescription ? (
                              <button
                                onClick={() =>
                                  handleViewPrescription(appt.prescription)
                                }
                                className="px-4 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
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
                          className="px-4 sm:px-6 py-4 text-center text-gray-200"
                        >
                          No medical history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    className="mt-6"
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default PatientDetails;
