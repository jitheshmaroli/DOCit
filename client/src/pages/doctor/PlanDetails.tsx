import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  getPlanSubscriptionCountsThunk,
  getSubscribedPatientsThunk,
} from '../../redux/thunks/doctorThunk';
import { Patient, PatientSubscription } from '../../types/authTypes';
import DataTable, { Column } from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import { ITEMS_PER_PAGE } from '../../utils/constants';
import ROUTES from '../../constants/routeConstants';
import { ArrowLeft, CreditCard, Clock, Activity } from 'lucide-react';

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    active: 'badge-success',
    expired: 'badge-error',
    cancelled: 'badge-warning',
  };
  return (
    <span className={`badge ${map[status] || 'badge-neutral'} capitalize`}>
      {status}
    </span>
  );
};

const PlanStatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    approved: 'badge-success',
    pending: 'badge-warning',
    rejected: 'badge-error',
  };
  return (
    <span className={`badge ${map[status] || 'badge-neutral'} capitalize`}>
      {status}
    </span>
  );
};

const StatCard = ({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className="stat-card">
    <div className={`stat-icon ${color}`}>{icon}</div>
    <div>
      <p className="text-xs text-text-muted mb-0.5">{label}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  </div>
);

const PlanDetails: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    plans,
    planSubscriptionCounts,
    loading,
    subscribedPatients,
    totalItems,
  } = useAppSelector((s) => s.doctors);
  const [activeTab, setActiveTab] = useState<'details' | 'patients'>('details');
  const [currentPage, setCurrentPage] = useState(1);

  const plan = plans.find((p) => p._id === planId);

  useEffect(() => {
    if (planId) {
      dispatch(getPlanSubscriptionCountsThunk(planId));
      dispatch(getSubscribedPatientsThunk());
    }
  }, [dispatch, planId]);

  const getSubscriptionForPlan = (
    patient: Patient,
    pid?: string
  ): PatientSubscription | undefined =>
    patient.subscribedPlans?.find((sub) => sub.planDetails?._id === pid);

  const patientColumns: Column<Patient>[] = [
    {
      header: 'Name',
      accessor: (p) => (
        <span className="font-medium text-text-primary">{p.name || 'N/A'}</span>
      ),
    },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Days Left',
      accessor: (p) => {
        const sub = getSubscriptionForPlan(p, planId);
        return sub?.remainingDays ?? 'N/A';
      },
    },
    {
      header: 'Appointments Left',
      accessor: (p) => {
        const sub = getSubscriptionForPlan(p, planId);
        return sub?.appointmentsLeft ?? 'N/A';
      },
    },
    {
      header: 'Status',
      accessor: (p) => {
        const sub = getSubscriptionForPlan(p, planId);
        return sub ? <StatusBadge status={sub.status} /> : 'N/A';
      },
    },
  ];

  const actions = [
    {
      label: 'View Details',
      onClick: (p: Patient) =>
        navigate(ROUTES.DOCTOR.PATIENT_DETAILS.replace(':patientId', p._id), {
          state: { from: 'plans' },
        }),
      className: 'btn-primary text-xs px-3 py-1.5',
    },
  ];

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-text-secondary font-medium">Plan not found.</p>
        <button
          onClick={() => navigate(ROUTES.DOCTOR.PLANS)}
          className="btn-secondary"
        >
          Back to Plans
        </button>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPats = subscribedPatients.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const counts = planId ? planSubscriptionCounts[planId] : undefined;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <button
          onClick={() => navigate(ROUTES.DOCTOR.PLANS)}
          className="btn-ghost text-sm flex items-center gap-1.5"
        >
          <ArrowLeft size={16} /> Back to Plans
        </button>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-surface-border">
          {(['details', 'patients'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3.5 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab === 'details' ? 'Plan Details' : 'Subscribed Patients'}
            </button>
          ))}
        </div>

        {/* ── Details tab ── */}
        {activeTab === 'details' && (
          <div className="p-6 space-y-6">
            {/* Subscription counts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Active Subscriptions"
                value={counts?.active || 0}
                icon={<Activity size={18} />}
                color="bg-emerald-50"
              />
              <StatCard
                label="Expired Subscriptions"
                value={counts?.expired || 0}
                icon={<Clock size={18} />}
                color="bg-red-50"
              />
              <StatCard
                label="Cancelled Subscriptions"
                value={counts?.cancelled || 0}
                icon={<CreditCard size={18} />}
                color="bg-amber-50"
              />
            </div>

            {/* Plan info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Plan Name', value: plan.name },
                { label: 'Price', value: `₹${plan.price.toFixed(2)}` },
                { label: 'Validity', value: `${plan.validityDays} days` },
                { label: 'Appointments', value: String(plan.appointmentCount) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="p-4 rounded-xl border border-surface-border bg-surface-bg"
                >
                  <p className="text-xs text-text-muted mb-0.5">{label}</p>
                  <p className="font-semibold text-text-primary">{value}</p>
                </div>
              ))}
              <div className="p-4 rounded-xl border border-surface-border bg-surface-bg">
                <p className="text-xs text-text-muted mb-1">Status</p>
                <PlanStatusBadge status={plan.status} />
              </div>
            </div>
          </div>
        )}

        {/* ── Patients tab ── */}
        {activeTab === 'patients' && (
          <div>
            <DataTable
              data={paginatedPats}
              columns={patientColumns}
              actions={actions}
              isLoading={loading}
              emptyMessage="No subscribed patients found."
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
        )}
      </div>
    </div>
  );
};

export default PlanDetails;
