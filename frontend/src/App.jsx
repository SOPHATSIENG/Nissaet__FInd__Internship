import { AuthProvider } from './context/AuthContext';
import WebRouter from './router/web';

export default function App() {
  return (
    <AuthProvider>
      <WebRouter />
    </AuthProvider>
  );
}

