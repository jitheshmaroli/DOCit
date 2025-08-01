import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Messages from './Profile/Messages';
import PersonalInformation from './Profile/PersonalInformation';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';

const ProfilePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('personal');
  const { user } = useAppSelector((state: RootState) => state.auth);

  const tabs = useMemo(
    () => [
      { id: 'personal', label: 'Personal Information' },
      { id: 'messages', label: 'Messages' },
    ],
    []
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabs.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams, tabs]);

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
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSearchParams({ tab: tab.id });
                    }}
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
            {activeTab === 'messages' && <Messages patientId={user?._id} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
