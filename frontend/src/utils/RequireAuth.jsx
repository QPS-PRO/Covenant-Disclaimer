// src/utils/RequireAuth.jsx
import { Navigate, useLocation } from "react-router-dom";
import { getAuthToken } from "./auth";

export default function RequireAuth({ children }) {
    const token = getAuthToken();
    const location = useLocation();

    if (!token) {
        // لو مش لوج إن، رجّعه على صفحة اللوجين واحتفظنا بالمسار اللي كان رايحه
        return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
    }
    return children;
}
