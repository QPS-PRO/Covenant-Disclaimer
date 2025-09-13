import { Navigate, useLocation } from "react-router-dom";
import { getAuthToken } from "./auth";

export function RequireGuest({ children }) {
    const token = getAuthToken();
    const location = useLocation();

    if (token) {
        const from = location.state?.from?.pathname || "/dashboard/home";
        return <Navigate to={from} replace />;
    }
    
    return children;
}

export default RequireGuest;