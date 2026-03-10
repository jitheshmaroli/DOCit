import React, { useState, useEffect } from 'react';
import { format, subMonths } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getDashboardStats, getReports } from '../../services/adminService';
import { validateDate } from '../../utils/validation';
import { showError, showWarning } from '../../utils/toastConfig';
import {
  Stethoscope,
  Users,
  CalendarDays,
  BriefcaseMedical,
  IndianRupee,
  XCircle,
  RefreshCcw,
  TrendingUp,
  BarChart2,
  FileDown,
} from 'lucide-react';

interface TopSubscriber {
  patientId: string;
  patientName: string;
  subscriptionCount: number;
  totalSpent: number;
}

interface TopPatient {
  patientId: string;
  patientName: string;
  appointmentCount: number;
}

interface TopDoctor {
  doctorId: string;
  doctorName: string;
  subscriberCount: number;
}

interface DashboardStats {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  activePlans: number;
  totalRevenue: number;
  topSubscribers: TopSubscriber[];
  topPatients: TopPatient[];
  topDoctors: TopDoctor[];
  cancelledStats: {
    count: number;
    totalRefunded: number;
  };
}

interface ReportFilter {
  type: 'daily' | 'monthly' | 'yearly';
  startDate?: Date;
  endDate?: Date;
}

interface ReportItem {
  date?: string;
  month?: string;
  year?: string;
  appointments: number;
  revenue: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    activePlans: 0,
    totalRevenue: 0,
    topSubscribers: [],
    topPatients: [],
    topDoctors: [],
    cancelledStats: { count: 0, totalRefunded: 0 },
  });
  const [reportType, setReportType] = useState<ReportFilter['type']>('monthly');
  const [startDate, setStartDate] = useState<string>(
    format(subMonths(new Date(), 1), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [reportData, setReportData] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const statsData = await getDashboardStats();
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const validateForm = () => {
    if (reportType !== 'daily') return true;
    const errors = {
      startDate: validateDate(startDate) || '',
      endDate: validateDate(endDate) || '',
    };
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.endDate = 'End date must be after start date';
    }
    setFormErrors(errors);
    return Object.values(errors).every((error) => !error);
  };

  const fetchReports = async () => {
    if (!validateForm()) {
      showError('Please fix the form errors');
      return;
    }
    try {
      setLoading(true);
      const data = await getReports({
        type: reportType,
        startDate: reportType === 'daily' ? new Date(startDate) : undefined,
        endDate: reportType === 'daily' ? new Date(endDate) : undefined,
      });
      const reportItems = data[reportType] || [];
      if (!Array.isArray(reportItems))
        throw new Error('Invalid report data format');
      setReportData(reportItems);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (reportData.length === 0) {
      showWarning('No report data available to export');
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Admin Revenue Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Report Type: ${reportType.toUpperCase()}`, 14, 30);
    if (reportType === 'daily') {
      doc.text(`From: ${startDate} To: ${endDate}`, 14, 38);
    }
    autoTable(doc, {
      startY: 50,
      head: [
        [
          reportType === 'daily'
            ? 'Date'
            : reportType === 'monthly'
              ? 'Month'
              : 'Year',
          'Appointments',
          'Revenue (₹)',
        ],
      ],
      body: reportData.map((item) => [
        reportType === 'daily'
          ? (item.date ?? 'N/A')
          : reportType === 'monthly'
            ? (item.month ?? 'N/A')
            : (item.year ?? 'N/A'),
        item.appointments,
        `₹${item.revenue.toFixed(2)}`,
      ]),
    });
    doc.save(
      `admin-report-${reportType}-${format(new Date(), 'yyyyMMdd')}.pdf`
    );
  };

  const statCards = [
    {
      title: 'Total Doctors',
      value: stats.totalDoctors,
      icon: Stethoscope,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      sub: 'Registered physicians',
    },
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: Users,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      sub: 'Active accounts',
    },
    {
      title: 'Appointments',
      value: stats.totalAppointments,
      icon: CalendarDays,
      iconBg: 'bg-accent-50',
      iconColor: 'text-accent-600',
      sub: 'All time bookings',
    },
    {
      title: 'Active Plans',
      value: stats.activePlans,
      icon: BriefcaseMedical,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      sub: 'Subscription plans',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toFixed(2)}`,
      icon: IndianRupee,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      sub: 'Gross earnings',
    },
    {
      title: 'Cancelled Plans',
      value: stats.cancelledStats.count,
      icon: XCircle,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      sub: 'Cancelled subscriptions',
    },
    {
      title: 'Total Refunded',
      value: `₹${stats.cancelledStats.totalRefunded.toFixed(2)}`,
      icon: RefreshCcw,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      sub: 'Refunded amount',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">
            Overview of platform activity and performance
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="stat-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-text-primary">
                    {stat.value}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{stat.sub}</p>
                </div>
                <div className={`stat-icon ${stat.iconBg}`}>
                  <Icon size={18} className={stat.iconColor} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Subscribers */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
              <TrendingUp size={14} className="text-primary-600" />
            </div>
            <h2 className="text-sm font-semibold text-text-primary">
              Top Subscribers
            </h2>
          </div>
          {stats.topSubscribers.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-6">
              No subscriber data available
            </p>
          ) : (
            <div className="table-wrapper">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="th">Patient</th>
                    <th className="th">Plans</th>
                    <th className="th">Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topSubscribers.slice(0, 5).map((s) => (
                    <tr key={s.patientId} className="tr">
                      <td className="td font-medium text-text-primary">
                        {s.patientName || 'N/A'}
                      </td>
                      <td className="td">{s.subscriptionCount}</td>
                      <td className="td text-primary-600 font-medium">
                        ₹{s.totalSpent.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Patients */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
              <Users size={14} className="text-teal-600" />
            </div>
            <h2 className="text-sm font-semibold text-text-primary">
              Top Patients
            </h2>
          </div>
          {stats.topPatients.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-6">
              No patient data available
            </p>
          ) : (
            <div className="table-wrapper">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="th">Patient</th>
                    <th className="th">Appointments</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topPatients.slice(0, 5).map((p) => (
                    <tr key={p.patientId} className="tr">
                      <td className="td font-medium text-text-primary">
                        {p.patientName || 'N/A'}
                      </td>
                      <td className="td">
                        <span className="badge badge-primary">
                          {p.appointmentCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Doctors */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-accent-50 flex items-center justify-center">
              <Stethoscope size={14} className="text-accent-600" />
            </div>
            <h2 className="text-sm font-semibold text-text-primary">
              Top Doctors
            </h2>
          </div>
          {stats.topDoctors.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-6">
              No doctor data available
            </p>
          ) : (
            <div className="table-wrapper">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="th">Doctor</th>
                    <th className="th">Subscribers</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topDoctors.slice(0, 5).map((d) => (
                    <tr key={d.doctorId} className="tr">
                      <td className="td font-medium text-text-primary">
                        {d.doctorName || 'N/A'}
                      </td>
                      <td className="td">
                        <span className="badge badge-success">
                          {d.subscriberCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reports Section */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
            <BarChart2 size={14} className="text-primary-600" />
          </div>
          <h2 className="text-sm font-semibold text-text-primary">
            Revenue Reports
          </h2>
        </div>

        <div className="flex flex-wrap gap-3 mb-5 items-end">
          <div>
            <label className="label">Report Type</label>
            <select
              value={reportType}
              onChange={(e) =>
                setReportType(e.target.value as ReportFilter['type'])
              }
              className="input w-40"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {reportType === 'daily' && (
            <>
              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setFormErrors({
                      ...formErrors,
                      startDate: validateDate(e.target.value) || '',
                    });
                  }}
                  className={`input w-44 ${formErrors.startDate ? 'input-error' : ''}`}
                />
                {formErrors.startDate && (
                  <p className="error-text">{formErrors.startDate}</p>
                )}
              </div>
              <div>
                <label className="label">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setFormErrors({
                      ...formErrors,
                      endDate: validateDate(e.target.value) || '',
                    });
                  }}
                  className={`input w-44 ${formErrors.endDate ? 'input-error' : ''}`}
                />
                {formErrors.endDate && (
                  <p className="error-text">{formErrors.endDate}</p>
                )}
              </div>
            </>
          )}

          <div className="flex gap-2">
            <button
              onClick={fetchReports}
              disabled={loading}
              className="btn-primary"
            >
              <BarChart2 size={15} />
              Generate Report
            </button>
            <button
              onClick={generatePDF}
              disabled={reportData.length === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown size={15} />
              Export PDF
            </button>
          </div>
        </div>

        {reportData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <BarChart2 size={36} className="mb-2 text-surface-border" />
            <p className="text-sm font-medium">No report data yet</p>
            <p className="text-xs mt-1">
              Select a type and generate a report to see data
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={reportData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey={
                  reportType === 'daily'
                    ? 'date'
                    : reportType === 'monthly'
                      ? 'month'
                      : 'year'
                }
                stroke="#94A3B8"
                tick={{ fill: '#64748B', fontSize: 12 }}
              />
              <YAxis
                stroke="#94A3B8"
                tick={{ fill: '#64748B', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  color: '#1E293B',
                  fontSize: 13,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}
              />
              <Bar
                dataKey="appointments"
                fill="#0EA5E9"
                name="Appointments"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="revenue"
                fill="#14B8A6"
                name="Revenue (₹)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
