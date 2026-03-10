import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import DataTable, { Column } from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import { getAppointedPatients } from '../../services/doctorService';
import { ITEMS_PER_PAGE } from '../../utils/constants';
import { Patient } from '../../types/authTypes';
import { showError } from '../../utils/toastConfig';
import ROUTES from '../../constants/routeConstants';
import { Search, Users } from 'lucide-react';

const StatusBadge = ({ patient }: { patient: Patient }) => {
  if (patient.isBlocked)
    return <span className="badge badge-error">Blocked</span>;
  if (patient.isSubscribed)
    return <span className="badge badge-success">Subscribed</span>;
  return <span className="badge badge-warning">Not Subscribed</span>;
};

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

  const columns: Column<Patient>[] = [
    {
      header: 'Name',
      accessor: (patient) => (
        <button
          onClick={() =>
            navigate(
              ROUTES.DOCTOR.PATIENT_DETAILS.replace(':patientId', patient._id)
            )
          }
          className="font-medium text-primary-600 hover:text-primary-700 hover:underline focus:outline-none"
        >
          {patient.name || 'N/A'}
        </button>
      ),
    },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: (p) => p.phone || 'N/A' },
    { header: 'Status', accessor: (p) => <StatusBadge patient={p} /> },
  ];

  const actions = [
    {
      label: 'View Details',
      onClick: (patient: Patient) =>
        navigate(
          ROUTES.DOCTOR.PATIENT_DETAILS.replace(':patientId', patient._id),
          { state: { from: 'patients' } }
        ),
      className: 'btn-primary text-xs px-3 py-1.5',
    },
  ];

  const filteredPatients = patients.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">
            View and manage your appointed patients
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-border flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9 py-2 text-sm w-full"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Users size={15} />
            <span>
              {filteredPatients.length} patient
              {filteredPatients.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <DataTable
          data={filteredPatients}
          columns={columns}
          actions={actions}
          isLoading={loading}
          emptyMessage="No patients found."
        />

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
    </div>
  );
};

export default DoctorPatients;
