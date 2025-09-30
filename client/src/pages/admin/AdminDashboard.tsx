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
import { toast } from 'react-toastify';
import { getDashboardStats, getReports } from '../../services/adminService';
import { validateDate } from '../../utils/validation';

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
  const [formErrors, setFormErrors] = useState({
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const statsData = await getDashboardStats();
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast.error('Failed to load dashboard data');
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
      toast.error('Please fix the form errors');
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
      if (!Array.isArray(reportItems)) {
        throw new Error('Invalid report data format');
      }
      setReportData(reportItems);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (reportData.length === 0) {
      toast.warn('No report data available to export');
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

  return (
    <div className="bg-white/10 backdrop-blur-lg p-4 sm:p-6 lg:p-8 rounded-2xl border border-white/20 shadow-xl space-y-6">
      <h1 className="text-xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
        Admin Dashboard
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            title: 'Total Doctors',
            value: stats.totalDoctors,
            icon: '👨‍⚕️',
            gradient: 'from-blue-600 to-blue-800',
          },
          {
            title: 'Total Patients',
            value: stats.totalPatients,
            icon: '👥',
            gradient: 'from-green-600 to-green-800',
          },
          {
            title: 'Total Appointments',
            value: stats.totalAppointments,
            icon: '📅',
            gradient: 'from-purple-600 to-purple-800',
          },
          {
            title: 'Active Plans',
            value: stats.activePlans,
            icon: '📋',
            gradient: 'from-yellow-600 to-yellow-800',
          },
          {
            title: 'Total Revenue',
            value: `₹${stats.totalRevenue.toFixed(2)}`,
            icon: '💰',
            gradient: 'from-red-600 to-red-800',
          },
        ].map((stat) => (
          <div
            key={stat.title}
            className={`bg-gradient-to-r ${stat.gradient} p-4 rounded-lg shadow-md text-white flex items-center space-x-3 transform hover:scale-105 transition-transform duration-200`}
          >
            <span className="text-3xl">{stat.icon}</span>
            <div>
              <h3 className="text-sm font-medium">{stat.title}</h3>
              <p className="text-lg font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top Subscribers Table */}
      <div className="bg-white/5 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-medium text-white mb-4">
          Top 5 Subscribers
        </h2>
        {stats.topSubscribers.length === 0 ? (
          <p className="text-white text-center">No subscriber data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-white text-sm">
              <thead>
                <tr className="bg-gray-700/30">
                  <th className="text-left py-2 px-3">Patient Name</th>
                  <th className="text-left py-2 px-3">Subscriptions</th>
                  <th className="text-left py-2 px-3">Total Spent (₹)</th>
                </tr>
              </thead>
              <tbody>
                {stats.topSubscribers.slice(0, 5).map((subscriber) => (
                  <tr
                    key={subscriber.patientId}
                    className="border-t border-white/10 hover:bg-gray-700/20 transition-colors"
                  >
                    <td className="py-2 px-3">
                      {subscriber.patientName || 'N/A'}
                    </td>
                    <td className="py-2 px-3">
                      {subscriber.subscriptionCount}
                    </td>
                    <td className="py-2 px-3">
                      ₹{subscriber.totalSpent.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Patients Table */}
      <div className="bg-white/5 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-medium text-white mb-4">
          Top 5 Patients by Appointments
        </h2>
        {stats.topPatients.length === 0 ? (
          <p className="text-white text-center">No patient data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-white text-sm">
              <thead>
                <tr className="bg-gray-700/30">
                  <th className="text-left py-2 px-3">Patient Name</th>
                  <th className="text-left py-2 px-3">Appointments Booked</th>
                </tr>
              </thead>
              <tbody>
                {stats.topPatients.slice(0, 5).map((patient) => (
                  <tr
                    key={patient.patientId}
                    className="border-t border-white/10 hover:bg-gray-700/20 transition-colors"
                  >
                    <td className="py-2 px-3">
                      {patient.patientName || 'N/A'}
                    </td>
                    <td className="py-2 px-3">{patient.appointmentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Doctors Table */}
      <div className="bg-white/5 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-medium text-white mb-4">
          Top 5 Doctors by Subscribers
        </h2>
        {stats.topDoctors.length === 0 ? (
          <p className="text-white text-center">No doctor data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-white text-sm">
              <thead>
                <tr className="bg-gray-700/30">
                  <th className="text-left py-2 px-3">Doctor Name</th>
                  <th className="text-left py-2 px-3">Subscribers</th>
                </tr>
              </thead>
              <tbody>
                {stats.topDoctors.slice(0, 5).map((doctor) => (
                  <tr
                    key={doctor.doctorId}
                    className="border-t border-white/10 hover:bg-gray-700/20 transition-colors"
                  >
                    <td className="py-2 px-3">{doctor.doctorName || 'N/A'}</td>
                    <td className="py-2 px-3">{doctor.subscriberCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reports Section */}
      <div className="bg-white/5 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-medium text-white mb-4">Revenue Reports</h2>
        <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center">
          <select
            value={reportType}
            onChange={(e) =>
              setReportType(e.target.value as ReportFilter['type'])
            }
            className="bg-gray-800 text-white p-2 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-48"
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          {reportType === 'daily' && (
            <>
              <div className="w-full sm:w-48">
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
                  className="bg-gray-800 text-white p-2 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm w-full"
                />
                {formErrors.startDate && (
                  <p className="text-red-400 text-xs mt-1">
                    {formErrors.startDate}
                  </p>
                )}
              </div>
              <div className="w-full sm:w-48">
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
                  className="bg-gray-800 text-white p-2 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm w-full"
                />
                {formErrors.endDate && (
                  <p className="text-red-400 text-xs mt-1">
                    {formErrors.endDate}
                  </p>
                )}
              </div>
            </>
          )}
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={fetchReports}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors text-sm flex-1 sm:flex-none"
            >
              Generate Report
            </button>
            <button
              onClick={generatePDF}
              disabled={reportData.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors text-sm flex-1 sm:flex-none"
            >
              Export PDF
            </button>
          </div>
        </div>
        {reportData.length === 0 ? (
          <p className="text-white text-center">No report data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff33" />
              <XAxis
                dataKey={
                  reportType === 'daily'
                    ? 'date'
                    : reportType === 'monthly'
                      ? 'month'
                      : 'year'
                }
                stroke="#ffffff"
                tick={{ fill: '#ffffff', fontSize: 12 }}
              />
              <YAxis
                stroke="#ffffff"
                tick={{ fill: '#ffffff', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                }}
              />
              <Bar dataKey="appointments" fill="#8884d8" name="Appointments" />
              <Bar dataKey="revenue" fill="#82ca9d" name="Revenue (₹)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
