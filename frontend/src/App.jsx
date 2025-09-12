// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard, Auth } from "./layouts";
import { AuthProvider } from "./lib/api";
import { RequireAuth } from "./utils/RequireAuth";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth/*" element={<Auth />} />
        <Route
          path="/dashboard/*"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
