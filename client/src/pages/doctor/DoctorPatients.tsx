import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import DataTable, { Column } from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import { getAppointedPatients } from '../../services/doctorService';
import { ITEMS_PER_PAGE } from '../../utils/constants';
import { Patient } from '../../types/authTypes';
import { showError } from '../../utils/toastConfig';

const DoctorPatients: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      if (!user?._id) return;
      try {
        setLoading(true);
        const response = await getAppointedPatients(
          currentPage,
          ITEMS_PER_PAGE
        );
        setPatients(response.data || []);
        setTotalItems(response.totalItems || 0);
      } catch {
        showError('Failed to fetch patients');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [dispatch, currentPage, user?._id]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const columns: Column<Patient>[] = [
    {
      header: 'Name',
      accessor: (patient) => (
        <button
          onClick={() => navigate(`/doctor/patient/${patient._id}`)}
          className="hover:underline hover:text-blue-300 focus:outline-none"
        >
          {patient.name || 'N/A'}
        </button>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Phone',
      accessor: (patient) => patient.phone || 'N/A',
    },
    {
      header: 'Status',
      accessor: (patient) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            patient.isBlocked
              ? 'bg-red-500/20 text-red-300'
              : patient.isSubscribed
                ? 'bg-green-500/20 text-green-300'
                : 'bg-yellow-500/20 text-yellow-300'
          }`}
        >
          {patient.isBlocked
            ? 'Blocked'
            : patient.isSubscribed
              ? 'Subscribed'
              : 'Not Subscribed'}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: 'View Details',
      onClick: (patient: Patient) =>
        navigate(`/doctor/patient/${patient._id}`, {
          state: { from: 'patients' },
        }),
      className: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <>
      <div className="bg-white/10 backdrop-blur-lg p-4 sm:p-6 rounded-2xl border border-white/20 shadow-xl">
        <h2 className="text-xl sm:text-2xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
          Patients
        </h2>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search patients..."
            className="w-full sm:w-1/3 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DataTable
          data={filteredPatients}
          columns={columns}
          actions={actions}
          isLoading={loading}
          emptyMessage="No patients found."
        />
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            className="mt-6"
          />
        )}
      </div>
    </>
  );
};

export default DoctorPatients;
