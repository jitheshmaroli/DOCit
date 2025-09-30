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
} from 'recharts';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  DoctorDashboardData,
  ReportFilter,
  ReportItem,
} from '../../types/reportTypes';

interface AppointmentStats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ReportFilter>({ type: 'monthly' });
  const [data, setData] = useState<DoctorDashboardData>({
    stats: null,
    appointments: [],
    plans: [],
    reportData: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle report filter changes
  const handleFilterChange = useCallback(
    async (newFilter: Partial<ReportFilter>) => {
      setIsLoading(true);
      setError(null);

      try {
        const updatedFilter = { ...filter, ...newFilter };
        setFilter(updatedFilter);

        const { reportData } = await fetchDashboardData({
          reportFilter: updatedFilter,
          page: 1,
          limit: 10,
        });

        setData((prev) => ({ ...prev, reportData }));
      } catch (error) {
        console.error('Error fetching report:', error);
        setError('Failed to load report data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [filter]
  );

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const dashboardData = await fetchDashboardData({
          reportFilter: { type: 'monthly' },
          page: 1,
          limit: 10,
        });
        setData(dashboardData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []); // Empty dependency array to run only once on mount

  // Generate PDF report
  const generatePDF = () => {
    const doc = new jsPDF();
    let finalY = 22;

    // Set font to DejaVu Sans for Unicode support
    doc.setFont('DejaVuSans', 'normal');

    doc.setFontSize(18);
    doc.text('Doctor Dashboard Report', 14, finalY);
    finalY += 8;

    doc.setFontSize(12);
    doc.text(`Report Type: ${filter.type.toUpperCase()}`, 14, finalY);
    finalY += 8;

    if (filter.startDate && filter.endDate) {
      doc.text(
        `Period: ${format(filter.startDate, 'MMM d, yyyy')} - ${format(filter.endDate, 'MMM d, yyyy')}`,
        14,
        finalY
      );
      finalY += 12;
    } else {
      finalY += 4;
    }

    // Stats Summary
    doc.text('Dashboard Statistics:', 14, finalY);
    finalY += 5;

    autoTable(doc, {
      startY: finalY,
      head: [['Metric', 'Value']],
      body: [
        ['Active Plans', data.stats?.activePlans.toString() || '0'],
        ['Total Subscribers', data.stats?.totalSubscribers.toString() || '0'],
        [
          'Appointments Through Plans',
          data.stats?.appointmentsThroughPlans.toString() || '0',
        ],
        ['Free Appointments', data.stats?.freeAppointments.toString() || '0'],
        ['Total Revenue', `₹${data.stats?.totalRevenue || 0}`],
      ],
      styles: { font: 'DejaVuSans' },
    });
    finalY += 30; // Approximate height for table + spacing

    // Plan-wise Revenue
    doc.text('Plan-wise Revenue:', 14, finalY);
    finalY += 5;

    autoTable(doc, {
      startY: finalY,
      head: [
        [
          'Plan Name',
          'Subscribers',
          'Revenue',
          'Appointments Used',
          'Appointments Left',
        ],
      ],
      body:
        data.stats?.planWiseRevenue.map((plan) => [
          plan.planName,
          plan.subscribers.toString(),
          `$${plan.revenue}`,
          plan.appointmentsUsed.toString(),
          plan.appointmentsLeft.toString(),
        ]) || [],
      styles: { font: 'DejaVuSans' },
    });
    finalY += data.stats?.planWiseRevenue.length
      ? data.stats.planWiseRevenue.length * 10 + 20
      : 20;

    // Report Data
    doc.text(`${filter.type.toUpperCase()} Report:`, 14, finalY);
    finalY += 5;

    const reportHeaders =
      filter.type === 'daily'
        ? ['Date', 'Appointments', 'Revenue']
        : filter.type === 'monthly'
          ? ['Month', 'Appointments', 'Revenue']
          : ['Year', 'Appointments', 'Revenue'];
    const reportBody =
      data.reportData?.map((item: ReportItem) => [
        item.date || item.month || item.year || '',
        item.appointments.toString(),
        `$${item.revenue}`,
      ]) || [];

    autoTable(doc, {
      startY: finalY,
      head: [reportHeaders],
      body: reportBody,
      styles: { font: 'DejaVuSans' },
    });

    doc.save(
      `Doctor_Dashboard_Report_${filter.type}_${new Date().toISOString()}.pdf`
    );
  };

  // Calculate appointment stats
  const appointmentStats: AppointmentStats = {
    total: data.appointments.length,
    upcoming: data.appointments.filter((appt) => appt.status === 'pending')
      .length,
    completed: data.appointments.filter((appt) => appt.status === 'completed')
      .length,
    cancelled: data.appointments.filter((appt) => appt.status === 'cancelled')
      .length,
  };

  return (
    <div className="space-y-6 font-poppins p-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-600/20 border border-red-600 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20">
        <h1 className="text-2xl font-bold text-white">Doctor Dashboard</h1>
        <p className="text-gray-300">
          Manage your practice and track performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/10 p-4 rounded-lg border border-white/20">
          <h3 className="text-gray-300">Active Plans</h3>
          <p className="text-2xl font-bold text-purple-300">
            {data.stats?.activePlans || 0}
          </p>
        </div>
        <div className="bg-white/10 p-4 rounded-lg border border-white/20">
          <h3 className="text-gray-300">Total Subscribers</h3>
          <p className="text-2xl font-bold text-green-300">
            {data.stats?.totalSubscribers || 0}
          </p>
        </div>
        <div className="bg-white/10 p-4 rounded-lg border border-white/20">
          <h3 className="text-gray-300">Appointments (Plans)</h3>
          <p className="text-2xl font-bold text-blue-300">
            {data.stats?.appointmentsThroughPlans || 0}
          </p>
        </div>
        <div className="bg-white/10 p-4 rounded-lg border border-white/20">
          <h3 className="text-gray-300">Free Appointments</h3>
          <p className="text-2xl font-bold text-yellow-300">
            {data.stats?.freeAppointments || 0}
          </p>
        </div>
        <div className="bg-white/10 p-4 rounded-lg border border-white/20">
          <h3 className="text-gray-300">Total Revenue</h3>
          <p className="text-2xl font-bold text-pink-300">
            ₹{data.stats?.totalRevenue || 0}
          </p>
        </div>
        <div className="bg-white/10 p-4 rounded-lg border border-white/20">
          <h3 className="text-gray-300">Total Appointments</h3>
          <p className="text-2xl font-bold text-purple-300">
            {appointmentStats.total}
          </p>
        </div>
        <div className="bg-white/10 p-4 rounded-lg border border-white/20">
          <h3 className="text-gray-300">Upcoming Appointments</h3>
          <p className="text-2xl font-bold text-green-300">
            {appointmentStats.upcoming}
          </p>
        </div>
        <div className="bg-white/10 p-4 rounded-lg border border-white/20">
          <h3 className="text-gray-300">Cancelled Appointments</h3>
          <p className="text-2xl font-bold text-red-300">
            {appointmentStats.cancelled}
          </p>
        </div>
      </div>

      {/* Report Section */}
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            Performance Reports
          </h2>
          <div className="flex gap-2">
            <select
              className="bg-white/20 text-white rounded-md p-2"
              value={filter.type}
              onChange={(e) => {
                const type = e.target.value as ReportFilter['type'];
                handleFilterChange({
                  type,
                  startDate: type === 'daily' ? new Date() : undefined,
                  endDate: type === 'daily' ? new Date() : undefined,
                });
              }}
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            {filter.type === 'daily' && (
              <div className="flex gap-2">
                <input
                  type="date"
                  className="bg-white/20 text-white rounded-md p-2"
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
                  className="bg-white/20 text-white rounded-md p-2"
                  value={
                    filter.endDate ? format(filter.endDate, 'yyyy-MM-dd') : ''
                  }
                  onChange={(e) =>
                    handleFilterChange({ endDate: new Date(e.target.value) })
                  }
                />
              </div>
            )}
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
              onClick={generatePDF}
            >
              Download PDF
            </button>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.reportData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff33" />
              <XAxis
                dataKey={
                  filter.type === 'daily'
                    ? 'date'
                    : filter.type === 'yearly'
                      ? 'year'
                      : 'month'
                }
                stroke="#ffffff99"
              />
              <YAxis stroke="#ffffff99" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff1a',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="appointments" fill="#a78bfa" />
              <Bar dataKey="revenue" fill="#4ade80" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Plans Section */}
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            Subscription Plans
          </h2>
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
            onClick={() => navigate('/doctor/plans')}
          >
            Manage Plans
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white/5 p-4 rounded-lg border border-white/10"
            >
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <p className="text-gray-300">Subscribers: {plan.subscribers}</p>
              <p
                className={`text-sm ${plan.expired ? 'text-red-600' : 'text-green-600'}`}
              >
                {plan.status.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Plan-wise Revenue Breakdown */}
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20">
        <h2 className="text-xl font-semibold mb-4 text-white">
          Plan-wise Revenue
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-white">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="p-2 text-left">Plan Name</th>
                <th className="p-2 text-right">Subscribers</th>
                <th className="p-2 text-right">Revenue (₹)</th>
                <th className="p-2 text-right">Appointments Used</th>
                <th className="p-2 text-right">Appointments Left</th>
              </tr>
            </thead>
            <tbody>
              {data.stats?.planWiseRevenue.map((plan) => (
                <tr key={plan.planId} className="border-b border-white/10">
                  <td className="p-2">{plan.planName}</td>
                  <td className="p-2 text-right">{plan.subscribers}</td>
                  <td className="p-2 text-right">₹{plan.revenue}</td>
                  <td className="p-2 text-right">{plan.appointmentsUsed}</td>
                  <td className="p-2 text-right">{plan.appointmentsLeft}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            Recent Appointments
          </h2>
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
            onClick={() => navigate('/doctor/appointments')}
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-white">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="p-2 text-left">Patient</th>
                <th className="p-2 text-right">Date</th>
                <th className="p-2 text-right">Time</th>
                <th className="p-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.appointments.map((appt) => (
                <tr key={appt._id} className="border-b border-gray-600">
                  {/* <td className="p-2">{appt.patientId.name}</td> */}
                  <td className="p-2"></td>
                  <td className="p-2 text-right">
                    {format(new Date(appt.date), 'MMM d, yyyy')}
                  </td>
                  <td className="p-2 text-right">{appt.startTime}</td>
                  <td
                    className={`p-2 text-right ${
                      appt.status === 'pending'
                        ? 'text-green-600'
                        : appt.status === 'completed'
                          ? 'text-blue-600'
                          : 'text-red-600'
                    }`}
                  >
                    {appt.status.toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <span className="text-white">Loading...</span>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
