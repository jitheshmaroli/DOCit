import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { useAppSelector } from './redux/hooks';
import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { toastConfig } from './utils/toastConfig';
import { useSocket } from './hooks/useSocket';
import ToastManager from './components/ToastManager';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { connect, disconnect, registerHandlers } = useSocket();

  useEffect(() => {
    if (user?._id) {
      const connectSocket = async () => {
        try {
          await connect(user._id);
          registerHandlers({
            onUserStatusUpdate: (status) => {
              console.log(
                `User status updated: ${status.userId} is ${status.isOnline ? 'online' : 'offline'}`
              );
            },
          });
        } catch (error) {
          console.error('Failed to connect socket:', error);
        }
      };

      connectSocket();
    }

    return () => {
      if (!user?._id) {
        disconnect('User logged out');
      }
    };
  }, [user?._id, connect, disconnect, registerHandlers]);

  return (
    <BrowserRouter>
      <ToastContainer {...toastConfig} limit={5} />
      <ToastManager />
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;