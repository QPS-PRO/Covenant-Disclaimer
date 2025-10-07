import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ReportsDashboard from './ReportsDashboard';
import ReportsListSimple from './ReportsListSimple';

// You can choose which component to use as the default
const ReportsRoutes = () => {
    return (
        <Routes>
            {/* Main reports page - using Dashboard version */}
            <Route path="/" element={<ReportsDashboard />} />
            
            {/* Alternative simple list view */}
            <Route path="/list" element={<ReportsListSimple />} />
            
            {/* Redirect any unknown routes to main reports page */}
            <Route path="*" element={<Navigate to="/reports" replace />} />
        </Routes>
    );
};

export default ReportsRoutes;

// Example usage in your main App.jsx or router configuration:
/*
import ReportsRoutes from './components/reports/ReportsRoutes';

// In your main Routes:
<Route path="/reports/*" element={<ReportsRoutes />} />
*/