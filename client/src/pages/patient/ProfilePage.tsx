import { useState } from 'react';
import AppointmentHistory from './Profile/AppointmentHistory';
import Messages from './Profile/Messages';
import Wallet from './Profile/Wallet';
import PersonalInformation from './Profile/PersonalInformation';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const { user } = useAppSelector((state: RootState) => state.auth);

  const tabs = [
    { id: 'personal', label: 'Personal Information' },
    { id: 'appointments', label: 'Appointment History' },
    { id: 'messages', label: 'Messages' },
    { id: 'billing', label: 'Billing & Payments' },
  ];

  if (!user) {
    return <div>Loading...</div>;
  }
  return (
    <div className="w-full py-6 bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900">
      <div className="container mx-auto px-4">
        <div className="w-full">
          <div className="mb-6 bg-white/10 backdrop-blur-lg border-b border-white/20 rounded-t-2xl overflow-hidden">
            <div className="overflow-x-auto pb-1">
              <div className="flex whitespace-nowrap">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`px-6 py-3 text-base font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg'
                        : 'text-gray-200 hover:text-purple-300'
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-b-2xl shadow-xl p-6">
            {activeTab === 'personal' && (
              <PersonalInformation patientId={user?._id} />
            )}
            {activeTab === 'appointments' && <AppointmentHistory />}
            {activeTab === 'messages' && <Messages />}
            {activeTab === 'billing' && <Wallet />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
