// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard, Auth } from "./layouts";
import { AuthProvider } from "./lib/api";
import { LanguageProvider } from "./context/LanguageContext";
import { RequireAuth } from "./utils/RequireAuth";
import { RequireGuest } from "./utils/RequireGuest";
import './lib/i18n'; // Initialize i18n

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
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
          <Route path="*" element={<Navigate to="/dashboard/home" replace />} />
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;