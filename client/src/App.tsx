import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { useAppSelector } from './redux/hooks';
import { useEffect } from 'react';
import { SocketManager } from './services/SocketManager';
import { toast, ToastContainer } from 'react-toastify';

const App = () => {
  const { user } = useAppSelector((state) => state.auth);
  const socketManager = SocketManager.getInstance();

  useEffect(() => {
    if (user?._id) {
      const connectSocket = async () => {
        try {
          await socketManager.connect(user._id);

          // Handle automatic reconnection
          socketManager.getSocket()?.on('disconnect', (reason) => {
            if (reason === 'io server disconnect') {
              // Server-initiated disconnect, attempt to reconnect
              setTimeout(() => connectSocket(), 1000);
            }
          });
        } catch (error) {
          console.error('Failed to connect socket:', error);
          toast.error('Failed to connect to real-time service');
        }
      };

      connectSocket();
    }

    return () => {
      // Only disconnect if user logs out
      if (!user?._id) {
        socketManager.disconnect('User logged out');
      }
    };
  }, [user?._id]);

  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
