import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Typography,
    Chip,
    Spinner,
    Alert,
    Accordion,
    AccordionHeader,
    AccordionBody,
} from '@material-tailwind/react';
import { ChevronDownIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { disclaimerEmployeeAPI, disclaimerUtils } from '@/lib/disclaimerApi';
import { useTranslation } from 'react-i18next';

export default function EmployeeDisclaimerHistory() {
    const { t } = useTranslation();
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openAccordion, setOpenAccordion] = useState(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await disclaimerEmployeeAPI.getHistory();

            // Group requests by process
            const processMap = {};

            if (data && Array.isArray(data)) {
                data.forEach((request) => {
                    const processId = request.process_info?.id || request.process;
                    if (!processMap[processId]) {
                        processMap[processId] = {
                            id: processId,
                            process_number: request.process_info?.process_number || 1,
                            status: request.process_info?.status || 'unknown',
                            total_steps: request.process_info?.total_steps || 0,
                            requests: [],
                            started_at: request.created_at,
                            completed_at: null,
                        };
                    }
                    processMap[processId].requests.push(request);

                    // Update completed_at with the latest reviewed date
                    if (
                        request.reviewed_at &&
                        (!processMap[processId].completed_at ||
                            new Date(request.reviewed_at) > new Date(processMap[processId].completed_at))
                    ) {
                        processMap[processId].completed_at = request.reviewed_at;
                    }
                });
            }

            // Convert to array and sort by process number (newest first)
            const processesArray = Object.values(processMap).sort((a, b) => b.process_number - a.process_number);
            setProcesses(processesArray);
        } catch (err) {
            console.error('Error loading history:', err);
            setError(t('employeeDisclaimerHistory.errors.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleAccordion = (processId) => {
        setOpenAccordion(openAccordion === processId ? null : processId);
    };

    const getProcessIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
            case 'blocked':
                return <XCircleIcon className="h-6 w-6 text-red-500" />;
            case 'in_progress':
                return <ClockIcon className="h-6 w-6 text-blue-500" />;
            default:
                return <ClockIcon className="h-6 w-6 text-gray-500" />;
        }
    };

    const calculateProgress = (requests, totalSteps) => {
        const approvedSteps = requests.filter((r) => r.status === 'approved').length;
        return totalSteps > 0 ? Math.round((approvedSteps / totalSteps) * 100) : 0;
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
                        {t('employeeDisclaimerHistory.header')}
                    </Typography>
                    <Typography variant="small" color="white" className="opacity-80 mt-1">
                        {t('employeeDisclaimerHistory.subtitle', {
                            defaultValue: 'View all your disclaimer processes and their progress',
                        })}
                    </Typography>
                </CardHeader>

                <CardBody>
                    {error && (
                        <Alert color="red" className="mb-6">
                            {error}
                        </Alert>
                    )}

                    {processes.length === 0 ? (
                        <div className="text-center py-12">
                            <Typography variant="h6" color="gray">
                                {t('employeeDisclaimerHistory.none')}
                            </Typography>
                            <Typography variant="small" color="gray" className="mt-2">
                                {t('employeeDisclaimerHistory.noneHint', {
                                    defaultValue: "You haven't started any disclaimer processes yet",
                                })}
                            </Typography>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {processes.map((process) => {
                                const progress = calculateProgress(process.requests, process.total_steps);
                                const completedSteps = process.requests.filter((r) => r.status === 'approved').length;
                                const duration = disclaimerUtils.calculateDuration(process.started_at, process.completed_at || new Date());

                                return (
                                    <Accordion
                                        key={process.id}
                                        open={openAccordion === process.id}
                                        icon={<ChevronDownIcon className="h-5 w-5" />}
                                    >
                                        <AccordionHeader
                                            onClick={() => handleAccordion(process.id)}
                                            className="border border-gray-200 rounded-lg px-6 hover:bg-gray-50"
                                        >
                                            <div className="flex items-center justify-between w-full pr-4">
                                                <div className="flex items-center gap-4">
                                                    {getProcessIcon(process.status)}
                                                    <div>
                                                        <Typography variant="h6" color="blue-gray">
                                                            {t('employeeDisclaimerHistory.processLabel', {
                                                                num: process.process_number,
                                                                defaultValue: 'Process #{{num}}',
                                                            })}
                                                        </Typography>
                                                        <Typography variant="small" color="gray">
                                                            {t('employeeDisclaimerHistory.startedOn', {
                                                                date: disclaimerUtils.formatDateOnly(process.started_at),
                                                                defaultValue: 'Started {{date}}',
                                                            })}
                                                            {duration
                                                                ? ` • ${duration} ${t('employeeDisclaimerHistory.days', {
                                                                    defaultValue: 'days',
                                                                })}`
                                                                : ''}
                                                        </Typography>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right mr-4">
                                                        <Typography variant="small" color="blue-gray" className="font-semibold">
                                                            {t('employeeDisclaimerHistory.stepsSummary', {
                                                                done: completedSteps,
                                                                total: process.total_steps,
                                                                defaultValue: '{{done}} / {{total}} Steps',
                                                            })}
                                                        </Typography>
                                                        <Typography variant="small" color="gray">
                                                            {t('employeeDisclaimerHistory.progressPercent', {
                                                                percent: progress,
                                                                defaultValue: '{{percent}}% Complete',
                                                            })}
                                                        </Typography>
                                                    </div>
                                                    <Chip
                                                        size="sm"
                                                        color={disclaimerUtils.getProcessBadgeColor(process.status)}
                                                        value={disclaimerUtils.getStatusLabel(process.status)}
                                                    />
                                                </div>
                                            </div>
                                        </AccordionHeader>
                                        <AccordionBody className="pt-0">
                                            <div className="space-y-3 p-4">
                                                {/* Progress Bar */}
                                                <div className="mb-6">
                                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                                        <div
                                                            className={`h-3 rounded-full ${process.status === 'completed'
                                                                    ? 'bg-green-500'
                                                                    : process.status === 'blocked'
                                                                        ? 'bg-red-500'
                                                                        : 'bg-blue-500'
                                                                }`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Individual Requests */}
                                                <div className="grid gap-3">
                                                    {process.requests
                                                        .sort((a, b) => a.step_number - b.step_number)
                                                        .map((request) => (
                                                            <Card key={request.id} className="border border-gray-100 shadow-sm">
                                                                <CardBody className="p-4">
                                                                    <div className="flex justify-between items-start mb-3">
                                                                        <div>
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <Typography variant="small" className="font-semibold">
                                                                                    {t('employeeDisclaimerHistory.step', { num: request.step_number })}
                                                                                </Typography>
                                                                                <Typography variant="small" color="blue-gray">
                                                                                    {request.target_department_name}
                                                                                </Typography>
                                                                            </div>
                                                                            <Typography variant="small" color="gray">
                                                                                {t('employeeDisclaimerHistory.createdAt', {
                                                                                    date: disclaimerUtils.formatDate(request.created_at),
                                                                                })}
                                                                            </Typography>
                                                                        </div>
                                                                        <Chip
                                                                            size="sm"
                                                                            color={disclaimerUtils.getStatusColor(request.status)}
                                                                            value={disclaimerUtils.getStatusLabel(request.status)}
                                                                        />
                                                                    </div>

                                                                    {request.employee_notes && (
                                                                        <div className="mb-2 p-2 bg-blue-50 rounded text-sm">
                                                                            <span className="font-semibold">
                                                                                {t('employeeDisclaimerHistory.myNotes')}
                                                                            </span>{' '}
                                                                            {request.employee_notes}
                                                                        </div>
                                                                    )}

                                                                    {request.manager_notes && (
                                                                        <div className="mb-2 p-2 bg-green-50 rounded text-sm">
                                                                            <span className="font-semibold">
                                                                                {t('employeeDisclaimerHistory.managerResponse')}
                                                                            </span>{' '}
                                                                            {request.manager_notes}
                                                                        </div>
                                                                    )}

                                                                    {request.rejection_reason && (
                                                                        <div className="p-2 bg-red-50 rounded border-l-4 border-red-500 text-sm">
                                                                            <span className="font-semibold text-red-700">
                                                                                {t('employeeDisclaimerHistory.rejectionReason')}
                                                                            </span>{' '}
                                                                            {request.rejection_reason}
                                                                        </div>
                                                                    )}
                                                                </CardBody>
                                                            </Card>
                                                        ))}
                                                </div>
                                            </div>
                                        </AccordionBody>
                                    </Accordion>
                                );
                            })}
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
