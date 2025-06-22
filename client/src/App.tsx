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
      socketManager.connect(user._id).catch((error) => {
        console.error('Failed to connect socket:', error);
        toast.error('Failed to connect to real-time service');
      });
    }

    // Cleanup only when the app unmounts (e.g., user logs out)
    return () => {
      if (!user?._id) {
        socketManager.disconnect();
      }
    };
  }, [user?._id, socketManager]);
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
