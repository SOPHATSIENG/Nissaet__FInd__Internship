import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import WebRouter from './router/web';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <WebRouter />
      </NotificationProvider>
    </AuthProvider>
  );
}

