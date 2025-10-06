// frontend/src/pages/dashboard/employee-disclaimer-history.jsx

import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Typography,
    Chip,
    Spinner,
    Alert,
} from '@material-tailwind/react';
import { disclaimerEmployeeAPI, disclaimerUtils } from '@/lib/disclaimerApi';

export default function EmployeeDisclaimerHistory() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await disclaimerEmployeeAPI.getHistory();
            setRequests(data || []);
        } catch (err) {
            console.error('Error loading history:', err);
            setError(err.message || 'Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="mt-12 mb-8 flex justify-center items-center h-64">
                <Spinner className="h-12 w-12" />
            </div>
        );
    }

    return (
        <div className="mt-12 mb-8 flex flex-col gap-12">
            <Card>
                <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
                    <Typography variant="h6" color="white">
                        My Disclaimer Request History
                    </Typography>
                </CardHeader>

                <CardBody>
                    {error && (
                        <Alert color="red" className="mb-6">
                            {error}
                        </Alert>
                    )}

                    <div className="space-y-4">
                        {requests.length === 0 ? (
                            <div className="text-center py-12">
                                <Typography variant="h6" color="gray">
                                    No disclaimer requests found
                                </Typography>
                            </div>
                        ) : (
                            requests.map((request) => (
                                <Card key={request.id} className="border border-gray-200">
                                    <CardBody>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Typography variant="h6" color="blue-gray">
                                                        {request.target_department_name}
                                                    </Typography>
                                                    <Chip
                                                        size="sm"
                                                        color={disclaimerUtils.getStatusColor(request.status)}
                                                        value={disclaimerUtils.getStatusLabel(request.status)}
                                                    />
                                                </div>
                                                <Typography variant="small" color="gray">
                                                    Step {request.step_number}
                                                </Typography>
                                                <Typography variant="small" color="gray">
                                                    {disclaimerUtils.formatDate(request.created_at)}
                                                </Typography>
                                            </div>
                                        </div>

                                        {request.employee_notes && (
                                            <div className="mb-3 p-3 bg-blue-50 rounded">
                                                <Typography variant="small" className="font-semibold mb-1">
                                                    My Notes:
                                                </Typography>
                                                <Typography variant="small" color="gray">
                                                    {request.employee_notes}
                                                </Typography>
                                            </div>
                                        )}

                                        {request.manager_notes && (
                                            <div className="mb-3 p-3 bg-green-50 rounded">
                                                <Typography variant="small" className="font-semibold mb-1">
                                                    Manager Response:
                                                </Typography>
                                                <Typography variant="small" color="gray">
                                                    {request.manager_notes}
                                                </Typography>
                                            </div>
                                        )}

                                        {request.rejection_reason && (
                                            <div className="p-3 bg-red-50 rounded border-l-4 border-red-500">
                                                <Typography variant="small" className="font-semibold mb-1 text-red-700">
                                                    Rejection Reason:
                                                </Typography>
                                                <Typography variant="small" color="gray">
                                                    {request.rejection_reason}
                                                </Typography>
                                            </div>
                                        )}

                                        {request.reviewed_at && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <Typography variant="small" color="gray">
                                                    Reviewed: {disclaimerUtils.formatDate(request.reviewed_at)}
                                                </Typography>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            ))
                        )}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
