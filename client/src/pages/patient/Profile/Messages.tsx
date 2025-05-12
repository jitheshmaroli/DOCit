/* eslint-disable no-empty-pattern */
import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Video, Phone } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
}

interface MessageThread {
  id: string;
  sender: string;
  subject: string;
  timestamp: string;
  messages: Message[];
}

// Dummy data for message threads
const dummyThreads: MessageThread[] = [
  {
    id: '1',
    sender: 'Dr. John Smith',
    subject: 'Follow-up Appointment',
    timestamp: '2025-05-10T10:30:00Z',
    messages: [
      {
        id: '1-1',
        content: 'Hi, just checking in regarding your recent test results.',
        sender: 'Dr. John Smith',
        timestamp: '2025-05-10T10:30:00Z',
      },
      {
        id: '1-2',
        content: 'Thanks, Doctor. Can we discuss this over a call?',
        sender: 'You',
        timestamp: '2025-05-10T10:35:00Z',
      },
      {
        id: '1-3',
        content: 'Sure, I’ll schedule a video call for tomorrow.',
        sender: 'Dr. John Smith',
        timestamp: '2025-05-10T10:40:00Z',
      },
    ],
  },
  {
    id: '2',
    sender: 'Nurse Emily Brown',
    subject: 'Medication Reminder',
    timestamp: '2025-05-09T14:20:00Z',
    messages: [
      {
        id: '2-1',
        content: 'Please remember to take your medication at 8 PM.',
        sender: 'Nurse Emily Brown',
        timestamp: '2025-05-09T14:20:00Z',
      },
      {
        id: '2-2',
        content: 'Got it, thanks for the reminder!',
        sender: 'You',
        timestamp: '2025-05-09T14:25:00Z',
      },
    ],
  },
  {
    id: '3',
    sender: 'Dr. Sarah Lee',
    subject: 'Lab Results Available',
    timestamp: '2025-05-08T09:15:00Z',
    messages: [
      {
        id: '3-1',
        content: 'Your lab results are ready. Please review them.',
        sender: 'Dr. Sarah Lee',
        timestamp: '2025-05-08T09:15:00Z',
      },
    ],
  },
];

const Messages = ({ }: { patientId: string }) => {
  const [threads, setThreads] = useState<MessageThread[]>(dummyThreads);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(threads[0] || null);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;

    const newMsg: Message = {
      id: `${selectedThread.id}-${selectedThread.messages.length + 1}`,
      content: newMessage,
      sender: 'You',
      timestamp: new Date().toISOString(),
    };

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === selectedThread.id
          ? { ...thread, messages: [...thread.messages, newMsg] }
          : thread
      )
    );
    setSelectedThread((prev) =>
      prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev
    );
    setNewMessage('');

    toast.success('Message sent!', {
      position: 'bottom-right',
      autoClose: 3000,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <ToastContainer position="bottom-right" />
      <h2 className="text-lg font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
        Messages
      </h2>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Inbox */}
        <div className="w-full md:w-1/3 bg-white/10 border border-white/20 rounded-lg p-4">
          <h3 className="text-white font-medium mb-4">Inbox</h3>
          {threads.length === 0 ? (
            <div className="text-gray-200">No messages found.</div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                    selectedThread?.id === thread.id
                      ? 'bg-white/20'
                      : 'hover:bg-white/20'
                  }`}
                  onClick={() => setSelectedThread(thread)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-white font-medium">{thread.sender}</h4>
                      <p className="text-gray-200 text-sm truncate">{thread.subject}</p>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {new Date(thread.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Chat Box */}
        <div className="w-full md:w-2/3 bg-white/10 border border-white/20 rounded-lg p-4 flex flex-col">
          {selectedThread ? (
            <>
              <div className="flex justify-between items-center border-b border-white/20 pb-2 mb-4">
                <div>
                  <h3 className="text-white font-medium">{selectedThread.sender}</h3>
                  <p className="text-gray-200 text-sm">{selectedThread.subject}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
                    title="Start Video Call"
                  >
                    <Video className="w-5 h-5 text-white" />
                  </button>
                  <button
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
                    title="Start Voice Call"
                  >
                    <Phone className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              <div className="flex-1 max-h-[50vh] overflow-y-auto space-y-4 px-2">
                {selectedThread.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === 'You' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.sender === 'You'
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                          : 'bg-white/20 text-gray-200'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(message.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="text-gray-200 flex-1 flex items-center justify-center">
              Select a message to view the conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;