// frontend/src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard, Auth } from "./layouts";
import { AuthProvider, useAuth } from "./lib/api";
import { LanguageProvider } from "./context/LanguageContext";
import { RequireAuth } from "./utils/RequireAuth";
import { RequireGuest } from "./utils/RequireGuest";
import { getDefaultRoute } from "./utils/authHelpers";
import './lib/i18n';
import ReportsRoutes from './components/Reports';
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const defaultRoute = getDefaultRoute(user);

  return (
    <Routes>
      <Route
        path="/auth/*"
        element={
          <RequireGuest>
            <Auth />
          </RequireGuest>
        }
      />
      <Route
        path="/dashboard/*"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route path="/" element={<Navigate to={defaultRoute} replace />} />
      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      <Route path="/reports/*" element={<ReportsRoutes />} />
    </Routes>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;