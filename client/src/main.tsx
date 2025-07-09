import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { Provider } from 'react-redux';
import { persistor, store } from './redux/store.ts';
import { PersistGate } from 'redux-persist/integration/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from './utils/config.ts';
import { SocketProvider } from './context/SocketContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <SocketProvider>
              <App />
          </SocketProvider>
        </GoogleOAuthProvider>
      </PersistGate>
    </Provider>
  </StrictMode>
);
