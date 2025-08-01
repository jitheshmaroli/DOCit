import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { useAppSelector } from './redux/hooks';
import { useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useSocket } from './hooks/useSocket';

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
          toast.error('Failed to connect to real-time service');
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
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
