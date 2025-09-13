import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/api";

export function RequireAuth({ children }) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
    }
    
    return children;
}

export default RequireAuth;