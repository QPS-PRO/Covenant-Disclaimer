// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard, Auth } from "./layouts";
import { AuthProvider } from "./lib/api";
import { RequireAuth } from "./utils/RequireAuth";
import { RequireGuest } from "./utils/RequireGuest";

function App() {
  return (
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
  );
}

export default App;