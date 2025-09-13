// src/utils/RequireAuth.jsx
import { Navigate, useLocation } from "react-router-dom";
import { getAuthToken } from "./auth";

export function RequireAuth({ children }) {
    const token = getAuthToken();
    const location = useLocation();

    if (!token) {
        return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
    }
    
    return children;
}

export default RequireAuth;