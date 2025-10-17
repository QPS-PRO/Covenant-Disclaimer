// frontend/src/App.jsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
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
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const defaultRoute = getDefaultRoute(user);

  // Don't redirect if user is already on a valid dashboard route
  const isOnValidDashboardRoute = location.pathname.startsWith('/dashboard/') && 
    (location.pathname.includes('/profile') || 
     location.pathname.includes('/my-disclaimer') || 
     location.pathname.includes('/disclaimer-requests') || 
     location.pathname.includes('/home') ||
     location.pathname.includes('/employees') ||
     location.pathname.includes('/assets') ||
     location.pathname.includes('/departments') ||
     location.pathname.includes('/transactions') ||
     location.pathname.includes('/admin-') ||
     location.pathname.includes('/disclaimer-') ||
     location.pathname.includes('/reports'));

  console.log('App routing debug:', {
    currentPath: location.pathname,
    defaultRoute,
    isOnValidDashboardRoute,
    user: user ? { id: user.id, role: user.employee_profile ? 'employee' : 'admin' } : null
  });

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
      <Route path="*" element={
        isOnValidDashboardRoute ? null : <Navigate to={defaultRoute} replace />
      } />
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