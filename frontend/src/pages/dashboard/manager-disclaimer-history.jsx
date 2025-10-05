// frontend/src/pages/dashboard/manager-disclaimer-history.jsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Typography,
    Chip,
    Spinner,
    Alert,
    Tabs,
    TabsHeader,
    Tab,
    TabsBody,
    TabPanel,
} from '@material-tailwind/react';
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline';
import { disclaimerManagerAPI, disclaimerUtils } from '@/lib/disclaimerApi';

export default function ManagerDisclaimerHistory() {
    const [allRequests, setAllRequests] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load statistics
            const stats = await disclaimerManagerAPI.getStatistics();
            setStatistics(stats);

            // Load all requests (we'll need to create this endpoint)
            // For now, we'll use pending requests as a placeholder
            const pending = await disclaimerManagerAPI.getPendingRequests();
            setAllRequests(pending || []);
        } catch (err) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const filterRequests = (status) => {
        if (status === 'all') return allRequests;
        return allRequests.filter(req => req.status === status);
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
            {/* Statistics Cards */}
            {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardBody className="text-center">
                            <ChartBarIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                            <Typography variant="h4" color="blue-gray">
                                {statistics.total_requests || 0}
                            </Typography>
                            <Typography variant="small" color="gray">
                                Total Requests
                            </Typography>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="text-center">
                            <ClockIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                            <Typography variant="h4" color="blue-gray">
                                {statistics.pending_requests || 0}
                            </Typography>
                            <Typography variant="small" color="gray">
                                Pending
                            </Typography>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="text-center">
                            <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <Typography variant="h4" color="blue-gray">
                                {statistics.approved_requests || 0}
                            </Typography>
                            <Typography variant="small" color="gray">
                                Approved
                            </Typography>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="text-center">
                            <XCircleIcon className="h-8 w-8 text-red-500 mx-auto mb-2" />
                            <Typography variant="h4" color="blue-gray">
                                {statistics.rejected_requests || 0}
                            </Typography>
                            <Typography variant="small" color="gray">
                                Rejected
                            </Typography>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Request History */}
            <Card>
                <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
                    <Typography variant="h6" color="white">
                        Disclaimer Request History
                    </Typography>
                </CardHeader>

                <CardBody>
                    {error && (
                        <Alert color="red" className="mb-6">
                            {error}
                        </Alert>
                    )}

                    <Tabs value={activeTab} onChange={setActiveTab}>
                        <TabsHeader>
                            <Tab value="all">
                                All ({allRequests.length})
                            </Tab>
                            <Tab value="pending">
                                Pending ({filterRequests('pending').length})
                            </Tab>
                            <Tab value="approved">
                                Approved ({filterRequests('approved').length})
                            </Tab>
                            <Tab value="rejected">
                                Rejected ({filterRequests('rejected').length})
                            </Tab>
                        </TabsHeader>

                        <TabsBody>
                            {['all', 'pending', 'approved', 'rejected'].map((tabValue) => (
                                <TabPanel key={tabValue} value={tabValue}>
                                    <div className="space-y-4">
                                        {filterRequests(tabValue).length === 0 ? (
                                            <div className="text-center py-12">
                                                <Typography variant="h6" color="gray">
                                                    No {tabValue === 'all' ? '' : tabValue} requests found
                                                </Typography>
                                            </div>
                                        ) : (
                                            filterRequests(tabValue).map((request) => (
                                                <Card key={request.id} className="border border-gray-200">
                                                    <CardBody>
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <Typography variant="h6" color="blue-gray">
                                                                        {request.employee_name}
                                                                    </Typography>
                                                                    <Chip
                                                                        size="sm"
                                                                        color={disclaimerUtils.getStatusColor(request.status)}
                                                                        value={disclaimerUtils.getStatusLabel(request.status)}
                                                                    />
                                                                </div>
                                                                <Typography variant="small" color="gray">
                                                                    Step {request.step_number} • {request.employee_department_name}
                                                                </Typography>
                                                                <Typography variant="small" color="gray">
                                                                    {disclaimerUtils.formatDate(request.created_at)}
                                                                </Typography>
                                                            </div>
                                                        </div>

                                                        {request.employee_notes && (
                                                            <div className="mb-3 p-3 bg-blue-50 rounded">
                                                                <Typography variant="small" className="font-semibold mb-1">
                                                                    Employee Notes:
                                                                </Typography>
                                                                <Typography variant="small" color="gray">
                                                                    {request.employee_notes}
                                                                </Typography>
                                                            </div>
                                                        )}

                                                        {request.manager_notes && (
                                                            <div className="mb-3 p-3 bg-green-50 rounded">
                                                                <Typography variant="small" className="font-semibold mb-1">
                                                                    Your Response:
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
                                </TabPanel>
                            ))}
                        </TabsBody>
                    </Tabs>
                </CardBody>
            </Card>
        </div>
    );
}