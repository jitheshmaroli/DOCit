import React from 'react';

const AdminDashboard: React.FC = () => {
  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl">
      <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
        Admin Dashboard
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[
          {
            title: 'Total Patients',
            value: '1,245',
            icon: '👥',
            bg: 'bg-purple-500/20',
          },
          {
            title: 'Total Doctors',
            value: '85',
            icon: '👨‍⚕️',
            bg: 'bg-blue-500/20',
          },
          {
            title: 'Appointments',
            value: '32',
            icon: '📅',
            bg: 'bg-indigo-500/20',
          },
          {
            title: 'Pending Requests',
            value: '12',
            icon: '⏳',
            bg: 'bg-fuchsia-500/20',
          },
        ].map((stat, index) => (
          <div
            key={index}
            className={`${stat.bg} p-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-200">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/20 backdrop-blur-lg p-6 rounded-lg border border-white/20 shadow-sm">
        <h3 className="text-lg font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="border-b border-white/20 pb-4 last:border-0 hover:bg-white/30 transition-all duration-300 rounded-lg p-2"
            >
              <p className="text-sm text-gray-200">
                New appointment scheduled with Dr. Smith
              </p>
              <p className="text-xs text-gray-400">2 hours ago</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
