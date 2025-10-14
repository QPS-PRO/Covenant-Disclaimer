import React, { useState, useEffect } from 'react';
import { Card, CardBody, Typography, Button, Textarea, Dialog, DialogHeader, DialogBody, DialogFooter, Chip, Alert, Spinner } from '@material-tailwind/react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, LockClosedIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import { disclaimerEmployeeAPI, disclaimerUtils } from '@/lib/disclaimerApi';

export default function EmployeeDisclaimerPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const [selectedStep, setSelectedStep] = useState(null);
    const [requestNotes, setRequestNotes] = useState('');
    const [showRequestDialog, setShowRequestDialog] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await disclaimerEmployeeAPI.getStatus();

            // CRITICAL: Add safety check and default value
            if (!data.flow_steps) {
                console.warn('flow_steps missing from API response, using empty array');
                data.flow_steps = [];
            }

            console.log('Loaded disclaimer status:', data);
            setStatus(data);
        } catch (err) {
            console.error('Error loading status:', err);
            setError(err.message || t('employeeDisclaimer.alerts.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleStartProcess = async () => {
        try {
            setSubmitting(true);
            setError(null);
            await disclaimerEmployeeAPI.startProcess();
            setSuccess(t('employeeDisclaimer.alerts.startSuccess'));
            await loadStatus();
        } catch (err) {
            console.error('Error starting process:', err);
            setError(err.message || t('employeeDisclaimer.alerts.startFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestClick = (step) => {
        if (!step.can_request) return;
        setSelectedStep(step);
        setRequestNotes('');
        setShowRequestDialog(true);
    };

    const handleSubmitRequest = async () => {
        if (!selectedStep) return;

        try {
            setSubmitting(true);
            setError(null);
            await disclaimerEmployeeAPI.submitRequest({
                target_department: selectedStep.department_id,
                step_number: selectedStep.step_number,
                employee_notes: requestNotes
            });
            setSuccess(t('employeeDisclaimer.alerts.submitSuccess', { name: selectedStep.department_name }));
            setShowRequestDialog(false);
            await loadStatus();
        } catch (err) {
            console.error('Error submitting request:', err);
            setError(err.message || t('employeeDisclaimer.alerts.submitFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    const getStepIcon = (step) => {
        if (step.is_completed) {
            return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
        }
        if (step.status === 'rejected') {
            return <XCircleIcon className="h-8 w-8 text-red-500" />;
        }
        if (step.status === 'pending') {
            return <ClockIcon className="h-8 w-8 text-yellow-500" />;
        }
        return <LockClosedIcon className="h-8 w-8 text-gray-400" />;
    };

    const getStepColor = (step) => {
        if (step.is_completed) return 'green';
        if (step.status === 'rejected') return 'red';
        if (step.status === 'pending') return 'yellow';
        if (step.is_active) return 'blue';
        return 'gray';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner className="h-12 w-12" />
            </div>
        );
    }

    if (!status) {
        return (
            <Alert color="red">{t('employeeDisclaimer.alerts.loadFailed')}</Alert>
        );
    }

    // CRITICAL: Safety check for flow_steps
    const flowSteps = status.flow_steps || [];
    const hasFlowSteps = flowSteps.length > 0;

    return (
        <div className="mt-12 mb-8 flex flex-col gap-12">
            <Card>
                <CardBody>
                    <div className="mb-6">
                        <Typography variant="h4" color="blue-gray" className="mb-2">
                            {t('employeeDisclaimer.title')}
                        </Typography>
                        <Typography color="gray" className="font-normal">
                            {t('employeeDisclaimer.subtitle')}
                        </Typography>
                    </div>

                    {error && (
                        <Alert color="red" className="mb-4" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert color="green" className="mb-4" onClose={() => setSuccess(null)}>
                            {success}
                        </Alert>
                    )}

                    {/* No flow configured */}
                    {!hasFlowSteps && (
                        <Alert color="amber" className="mb-4">
                            {t('employeeDisclaimer.noFlow')}
                        </Alert>
                    )}

                    {/* Can start new process */}
                    {!status.has_active_process && (status.can_start_process || status.can_start_new_process) && hasFlowSteps && (
                        <div className="text-center py-8">
                            <Typography className="mb-4">
                                {t('employeeDisclaimer.start.noActive')}
                            </Typography>
                            <Button
                                color="blue"
                                onClick={handleStartProcess}
                                disabled={submitting}
                            >
                                {submitting ? t('employeeDisclaimer.start.starting') : t('employeeDisclaimer.start.cta')}
                            </Button>
                        </div>
                    )}

                    {/* Active process display */}
                    {status.has_active_process && hasFlowSteps && (
                        <>
                            <div className="mb-8">
                                <div className="flex justify-between items-center mb-4">
                                    <Typography variant="h6" color="blue-gray">
                                        {t('employeeDisclaimer.progress', {
                                            current: status.process?.current_step || 0,
                                            total: status.process?.total_steps || 0
                                        })}
                                    </Typography>
                                    <Chip
                                        value={disclaimerUtils.getStatusLabel(status.process?.status)}
                                        color={disclaimerUtils.getStatusColor(status.process?.status)}
                                    />
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${status.process?.progress_percentage || 0}%` }}
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                {flowSteps.map((step, index) => (
                                    <div key={step.step_number} className="mb-8">
                                        <div className="flex items-start gap-4">
                                            {/* Step Icon */}
                                            <div className="flex flex-col items-center">
                                                <div className={`rounded-full p-2 ${step.is_active ? 'bg-blue-50' : 'bg-gray-50'}`}>
                                                    {getStepIcon(step)}
                                                </div>
                                                {index < flowSteps.length - 1 && (
                                                    <div className={`w-0.5 h-16 ${step.is_completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                )}
                                            </div>

                                            {/* Step Content */}
                                            <div className="flex-1">
                                                <Card className={`${step.is_active ? 'border-2 border-blue-500' : ''}`}>
                                                    <CardBody className="p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <Typography variant="h6" color="blue-gray">
                                                                    {t('employeeDisclaimer.stepTitle', { num: step.step_number, name: step.department_name })}
                                                                </Typography>
                                                                <Chip
                                                                    size="sm"
                                                                    value={disclaimerUtils.getStatusLabel(step.status)}
                                                                    color={getStepColor(step)}
                                                                    className="mt-2"
                                                                />
                                                            </div>
                                                            {step.can_request && (
                                                                <Button
                                                                    size="sm"
                                                                    color="blue"
                                                                    onClick={() => handleRequestClick(step)}
                                                                    disabled={submitting}
                                                                >
                                                                    {step.status === 'rejected'
                                                                        ? t('employeeDisclaimer.resubmitRequest')
                                                                        : t('employeeDisclaimer.submitRequest')}
                                                                </Button>
                                                            )}
                                                        </div>

                                                        {step.request && (
                                                            <div className="mt-4 space-y-3">
                                                                {step.request.employee_notes && (
                                                                    <div className="bg-gray-50 p-3 rounded">
                                                                        <Typography variant="small" className="font-semibold mb-1">
                                                                            {t('employeeDisclaimer.yourNotes')}
                                                                        </Typography>
                                                                        <Typography variant="small" color="gray">
                                                                            {step.request.employee_notes}
                                                                        </Typography>
                                                                    </div>
                                                                )}

                                                                {step.request.status !== 'pending' && (
                                                                    <>
                                                                        {step.request.manager_notes && (
                                                                            <div className={`p-3 rounded ${step.request.status === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
                                                                                <Typography variant="small" className="font-semibold mb-1">
                                                                                    {t('employeeDisclaimerHistory.managerResponse')}
                                                                                </Typography>
                                                                                <Typography variant="small">
                                                                                    {step.request.manager_notes}
                                                                                </Typography>
                                                                            </div>
                                                                        )}

                                                                        {step.request.rejection_reason && (
                                                                            <div className="bg-red-50 p-3 rounded border border-red-200">
                                                                                <Typography variant="small" className="font-semibold mb-1 text-red-700">
                                                                                    {t('employeeDisclaimerHistory.rejectionReason')}
                                                                                </Typography>
                                                                                <Typography variant="small" className="text-red-600">
                                                                                    {step.request.rejection_reason}
                                                                                </Typography>
                                                                            </div>
                                                                        )}

                                                                        {step.request.reviewed_at && (
                                                                            <div className="flex justify-between text-xs text-gray-600">
                                                                                <span>
                                                                                    {t('managerPendingRequests.fields.reviewedBy', {
                                                                                        name: step.request.reviewed_by_name || 'N/A'
                                                                                    })}
                                                                                </span>
                                                                                <span>{disclaimerUtils.formatDate(step.request.reviewed_at)}</span>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}

                                                                {step.request.status === 'pending' && (
                                                                    <div className="bg-yellow-50 p-3 rounded">
                                                                        <Typography variant="small" className="text-yellow-800">
                                                                            {t('employeeDisclaimer.waitingReview')}
                                                                        </Typography>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {!step.request && !step.can_request && step.status === 'locked' && (
                                                            <div className="mt-4 bg-gray-50 p-3 rounded">
                                                                <Typography variant="small" color="gray">
                                                                    {t('employeeDisclaimer.lockedMsg')}
                                                                </Typography>
                                                            </div>
                                                        )}
                                                    </CardBody>
                                                </Card>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {status.process?.status === 'completed' && (
                                <Alert color="green" className="mt-6">
                                    <Typography variant="h6" className="mb-2">
                                        {t('employeeDisclaimer.completedTitle')}
                                    </Typography>
                                    <Typography>
                                        {t('employeeDisclaimer.completedBody')}
                                    </Typography>
                                </Alert>
                            )}
                        </>
                    )}
                </CardBody>
            </Card>

            {/* Request Dialog */}
            <Dialog open={showRequestDialog} handler={() => setShowRequestDialog(false)} size="md">
                <DialogHeader>
                    {t('employeeDisclaimer.dialog.title', { name: selectedStep?.department_name })}
                </DialogHeader>
                <DialogBody divider className="space-y-4">
                    <Typography>
                        {t('employeeDisclaimer.dialog.body', { name: selectedStep?.department_name })}
                    </Typography>
                    <Textarea
                        label={t('employeeDisclaimer.dialog.notesLabel')}
                        value={requestNotes}
                        onChange={(e) => setRequestNotes(e.target.value)}
                        placeholder={t('employeeDisclaimer.dialog.notesPlaceholder')}
                        rows={4}
                    />
                </DialogBody>
                <DialogFooter className="gap-2">
                    <Button
                        variant="text"
                        color="gray"
                        onClick={() => setShowRequestDialog(false)}
                        disabled={submitting}
                    >
                        {t('employeeDisclaimer.dialog.cancel')}
                    </Button>
                    <Button
                        color="blue"
                        onClick={handleSubmitRequest}
                        disabled={submitting}
                    >
                        {submitting ? t('employeeDisclaimer.dialog.submitting') : t('employeeDisclaimer.dialog.submit')}
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    );
}