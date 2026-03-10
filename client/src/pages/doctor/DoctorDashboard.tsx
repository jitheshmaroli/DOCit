import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardData } from '../../services/doctorService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from '../../components/common/Pagination';
import {
  DoctorDashboardData,
  ReportFilter,
  ReportItem,
} from '../../types/reportTypes';
import {
  CreditCard,
  Users,
  Calendar,
  Activity,
  TrendingDown,
  Download,
  AlertCircle,
  ChevronRight,
  Clock,
} from 'lucide-react';

interface AppointmentStats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || 'badge-neutral'}`}
    >
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
  value: string | number;
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

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ReportFilter>({ type: 'monthly' });
  const [data, setData] = useState<DoctorDashboardData>({
    stats: null,
    appointments: [],
    plans: [],
    reportData: [],
  });
  const [planPage, setPlanPage] = useState(1);
  const [planLimit] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const handleFilterChange = useCallback(
    async (newFilter: Partial<ReportFilter>) => {
      setError(null);
      try {
        const updated = { ...filter, ...newFilter };
        setFilter(updated);
        const { reportData } = await fetchDashboardData({
          reportFilter: updated,
          page: planPage,
          limit: planLimit,
        });
        setData((p) => ({ ...p, reportData }));
      } catch {
        setError('Failed to load report data.');
      }
    },
    [filter, planPage, planLimit]
  );

  const handlePlanPageChange = useCallback(
    async (newPage: number) => {
      setError(null);
      try {
        setPlanPage(newPage);
        const d = await fetchDashboardData({
          reportFilter: filter,
          page: newPage,
          limit: planLimit,
        });
        setData(d);
      } catch {
        setError('Failed to load dashboard data.');
      }
    },
    [filter, planLimit]
  );

  useEffect(() => {
    const init = async () => {
      setError(null);
      try {
        const d = await fetchDashboardData({
          reportFilter: { type: 'monthly' },
          page: planPage,
          limit: planLimit,
        });
        setData(d);
      } catch {
        setError('Failed to load dashboard data.');
      }
    };
    init();
  }, [planPage, planLimit]);

  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 22;
    doc.setFontSize(18);
    doc.text('Doctor Dashboard Report', 14, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`Report Type: ${filter.type.toUpperCase()}`, 14, y);
    y += 8;
    if (filter.startDate && filter.endDate) {
      doc.text(
        `Period: ${format(filter.startDate, 'MMM d, yyyy')} - ${format(filter.endDate, 'MMM d, yyyy')}`,
        14,
        y
      );
      y += 12;
    } else y += 4;
    doc.text('Dashboard Statistics:', 14, y);
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Active Plans', data.stats?.activePlans?.toString() || '0'],
        ['Total Subscribers', data.stats?.totalSubscribers?.toString() || '0'],
        [
          'Appointments Through Plans',
          data.stats?.appointmentsThroughPlans?.toString() || '0',
        ],
        ['Free Appointments', data.stats?.freeAppointments?.toString() || '0'],
        ['Total Revenue', `₹${data.stats?.totalRevenue || 0}`],
        [
          'Cancelled Subscriptions',
          data.stats?.cancelledStats.count?.toString() || '0',
        ],
        ['Total Refunded', `₹${data.stats?.cancelledStats.totalRefunded || 0}`],
      ],
    });
    y += 30;
    doc.text('Plan-wise Revenue:', 14, y);
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [
        ['Plan Name', 'Subscribers', 'Revenue', 'Appts Used', 'Appts Left'],
      ],
      body:
        data.stats?.planWiseRevenue.map((p) => [
          p.planName,
          p.subscribers.toString(),
          `₹${p.revenue}`,
          p.appointmentsUsed.toString(),
          p.appointmentsLeft.toString(),
        ]) || [],
    });
    y += data.stats?.planWiseRevenue.length
      ? data.stats.planWiseRevenue.length * 10 + 20
      : 20;
    doc.text(`${filter.type.toUpperCase()} Report:`, 14, y);
    y += 5;
    const reportHeaders =
      filter.type === 'daily'
        ? ['Date', 'Appointments', 'Revenue']
        : filter.type === 'monthly'
          ? ['Month', 'Appointments', 'Revenue']
          : ['Year', 'Appointments', 'Revenue'];
    autoTable(doc, {
      startY: y,
      head: [reportHeaders],
      body:
        data.reportData?.map((item: ReportItem) => [
          item.date || item.month || item.year || '',
          item.appointments.toString(),
          `₹${item.revenue}`,
        ]) || [],
    });
    doc.save(
      `Doctor_Dashboard_Report_${filter.type}_${new Date().toISOString()}.pdf`
    );
  };

  const appointmentStats: AppointmentStats = {
    total: data.appointments.length,
    upcoming: data.appointments.filter((a) => a.status === 'pending').length,
    completed: data.appointments.filter((a) => a.status === 'completed').length,
    cancelled: data.appointments.filter((a) => a.status === 'cancelled').length,
  };

  const xKey =
    filter.type === 'daily'
      ? 'date'
      : filter.type === 'yearly'
        ? 'year'
        : 'month';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Manage your practice and track performance
          </p>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle size={15} className="text-error flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Active Plans"
          value={data.stats?.activePlans || 0}
          icon={<CreditCard size={18} />}
          color="bg-primary-50"
        />
        <StatCard
          label="Total Subscribers"
          value={data.stats?.totalSubscribers || 0}
          icon={<Users size={18} />}
          color="bg-teal-50"
        />
        <StatCard
          label="Appointments (Plans)"
          value={data.stats?.appointmentsThroughPlans || 0}
          icon={<Calendar size={18} />}
          color="bg-accent-50"
        />
        <StatCard
          label="Free Appointments"
          value={data.stats?.freeAppointments || 0}
          icon={<Activity size={18} />}
          color="bg-amber-50"
        />
        <StatCard
          label="Total Revenue"
          value={`₹${data.stats?.totalRevenue || 0}`}
          icon={<TrendingDown size={18} />}
          color="bg-emerald-50"
        />
        <StatCard
          label="Total Appointments"
          value={appointmentStats.total}
          icon={<Calendar size={18} />}
          color="bg-primary-50"
        />
        <StatCard
          label="Upcoming"
          value={appointmentStats.upcoming}
          icon={<Clock size={18} />}
          color="bg-teal-50"
        />
        <StatCard
          label="Cancelled Appointments"
          value={appointmentStats.cancelled}
          icon={<AlertCircle size={18} />}
          color="bg-red-50"
        />
        <StatCard
          label="Cancelled Subscriptions"
          value={data.stats?.cancelledStats?.count || 0}
          icon={<TrendingDown size={18} />}
          color="bg-red-50"
        />
        <StatCard
          label="Total Refunded"
          value={`₹${data.stats?.cancelledStats?.totalRefunded || 0}`}
          icon={<CreditCard size={18} />}
          color="bg-red-50"
        />
      </div>

      {/* ── Report section ── */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 className="font-display font-bold text-text-primary text-lg">
            Performance Reports
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {/* Report type */}
            <select
              value={filter.type}
              onChange={(e) => {
                const type = e.target.value as ReportFilter['type'];
                handleFilterChange({
                  type,
                  startDate: type === 'daily' ? new Date() : undefined,
                  endDate: type === 'daily' ? new Date() : undefined,
                });
              }}
              className="input py-2 text-sm w-32"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            {/* Date range */}
            {filter.type === 'daily' && (
              <>
                <input
                  type="date"
                  className="input py-2 text-sm w-36"
                  value={
                    filter.startDate
                      ? format(filter.startDate, 'yyyy-MM-dd')
                      : ''
                  }
                  onChange={(e) =>
                    handleFilterChange({ startDate: new Date(e.target.value) })
                  }
                />
                <input
                  type="date"
                  className="input py-2 text-sm w-36"
                  value={
                    filter.endDate ? format(filter.endDate, 'yyyy-MM-dd') : ''
                  }
                  onChange={(e) =>
                    handleFilterChange({ endDate: new Date(e.target.value) })
                  }
                />
              </>
            )}
            <button onClick={generatePDF} className="btn-primary text-sm">
              <Download size={14} /> Download PDF
            </button>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.reportData}
              margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey={xKey} stroke="#94A3B8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 24px rgba(15,23,42,.08)',
                  color: '#0F172A',
                  fontSize: 13,
                }}
                cursor={{ fill: '#F1F5F9' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#475569' }} />
              <Bar
                dataKey="appointments"
                name="Appointments"
                fill="#0EA5E9"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="revenue"
                name="Revenue (₹)"
                fill="#14B8A6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Plan-wise revenue ── */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-border">
          <h2 className="font-display font-bold text-text-primary text-lg">
            Plan-wise Revenue
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-surface-border bg-surface-bg">
                <th className="th text-left">Plan Name</th>
                <th className="th text-right">Subscribers</th>
                <th className="th text-right">Revenue</th>
                <th className="th text-right">Appts Used</th>
                <th className="th text-right">Appts Left</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {data.stats?.planWiseRevenue.length ? (
                data.stats.planWiseRevenue.map((plan) => (
                  <tr key={plan.planId} className="tr">
                    <td className="td font-medium text-text-primary">
                      {plan.planName}
                    </td>
                    <td className="td text-right">{plan.subscribers}</td>
                    <td className="td text-right font-semibold text-teal-600">
                      ₹{plan.revenue}
                    </td>
                    <td className="td text-right">{plan.appointmentsUsed}</td>
                    <td className="td text-right">{plan.appointmentsLeft}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="td text-center text-text-muted py-8"
                  >
                    No plan data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-surface-border">
          <Pagination
            currentPage={planPage}
            totalPages={Math.ceil((data.stats?.totalPlans || 0) / planLimit)}
            onPageChange={handlePlanPageChange}
          />
        </div>
      </div>

      {/* ── Recent appointments ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="font-display font-bold text-text-primary text-lg">
            Recent Appointments
          </h2>
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            View All <ChevronRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-surface-border bg-surface-bg">
                <th className="th text-left">Patient</th>
                <th className="th text-left">Date</th>
                <th className="th text-left">Time</th>
                <th className="th text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {data.appointments.length ? (
                data.appointments.map((appt) => (
                  <tr key={appt._id} className="tr">
                    <td className="td font-medium text-text-primary">
                      {appt.patientId.name}
                    </td>
                    <td className="td">
                      {format(new Date(appt.date), 'MMM d, yyyy')}
                    </td>
                    <td className="td">
                      {appt.startTime} – {appt.endTime}
                    </td>
                    <td className="td">
                      <StatusBadge status={appt.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="td text-center text-text-muted py-8"
                  >
                    No recent appointments.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
