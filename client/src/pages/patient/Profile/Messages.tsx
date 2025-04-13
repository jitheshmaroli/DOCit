import React, { useState } from 'react';

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const messages = [
    {
      id: '1',
      doctor: 'Dr. Sarah Johnson',
      lastMessage: 'Your next appointment is scheduled for tomorrow.',
      timestamp: '2025-04-04 10:30 AM',
      unread: 2,
      chatHistory: [
        {
          sender: 'Dr. Sarah Johnson',
          text: 'Hi John, how are you feeling today?',
          timestamp: '2025-04-03 09:15 AM',
        },
        {
          sender: 'You',
          text: 'Hi Dr. Johnson, I’m feeling better, thanks!',
          timestamp: '2025-04-03 09:20 AM',
        },
        {
          sender: 'Dr. Sarah Johnson',
          text: 'Great to hear! Your next appointment is scheduled for tomorrow.',
          timestamp: '2025-04-04 10:30 AM',
        },
      ],
    },
    {
      id: '2',
      doctor: 'Dr. Michael Lee',
      lastMessage: 'Please review your latest prescription.',
      timestamp: '2025-04-03 02:45 PM',
      unread: 0,
      chatHistory: [
        {
          sender: 'Dr. Michael Lee',
          text: 'I’ve updated your prescription.',
          timestamp: '2025-04-03 02:40 PM',
        },
        {
          sender: 'You',
          text: 'Thanks, I’ll check it out.',
          timestamp: '2025-04-03 02:42 PM',
        },
        {
          sender: 'Dr. Michael Lee',
          text: 'Please review your latest prescription.',
          timestamp: '2025-04-03 02:45 PM',
        },
      ],
    },
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    console.log(`Sending message to ${selectedChat}: ${newMessage}`);
    setNewMessage('');
  };

  const selectedChatData = messages.find((msg) => msg.id === selectedChat);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Inbox Section */}
      <div className="w-full md:w-1/3 bg-white/20 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
        <h2 className="text-lg font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
          Inbox
        </h2>
        {messages.length === 0 ? (
          <div className="p-6 text-center text-gray-200">
            No messages found.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                  selectedChat === msg.id
                    ? 'bg-purple-500/20 border border-purple-400'
                    : 'hover:bg-white/30'
                }`}
                onClick={() => setSelectedChat(msg.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-semibold">{msg.doctor}</h3>
                    <p className="text-sm text-gray-200 truncate">
                      {msg.lastMessage}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{msg.timestamp}</p>
                    {msg.unread > 0 && (
                      <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center mt-1">
                        {msg.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Section */}
      <div className="w-full md:w-2/3 bg-white/20 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6 flex flex-col">
        <h2 className="text-lg font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
          Messages
        </h2>
        {selectedChat === null ? (
          <div className="flex-1 flex items-center justify-center text-gray-200">
            Select a conversation to view messages.
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="border-b border-white/20 pb-4 mb-4">
              <h3 className="text-white font-semibold">
                {selectedChatData?.doctor}
              </h3>
              <p className="text-sm text-gray-200">
                Last message: {selectedChatData?.timestamp}
              </p>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto max-h-[400px] space-y-4">
              {selectedChatData?.chatHistory.map((chat, index) => (
                <div
                  key={index}
                  className={`flex ${chat.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg text-white ${
                      chat.sender === 'You'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600'
                        : 'bg-white/30'
                    }`}
                  >
                    <p>{chat.text}</p>
                    <p className="text-xs text-gray-300 mt-1">
                      {chat.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Messages;
