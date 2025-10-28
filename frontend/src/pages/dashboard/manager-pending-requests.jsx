import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    Typography,
    Button,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Textarea,
    Radio,
    Alert,
    Spinner,
    Chip,
} from '@material-tailwind/react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import { disclaimerManagerAPI, disclaimerUtils } from '@/lib/disclaimerApi';

export default function ManagerPendingRequests() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [reviewStatus, setReviewStatus] = useState('approved');
    const [managerNotes, setManagerNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await disclaimerManagerAPI.getPendingRequests();
            setRequests(data);
        } catch (err) {
            setError('loadFailed');
        } finally {
            setLoading(false);
        }
    };

    const handleReviewClick = (request) => {
        setSelectedRequest(request);
        setReviewStatus('approved');
        setManagerNotes('');
        setRejectionReason('');
        setShowReviewDialog(true);
    };

    const handleSubmitReview = async () => {
        if (!selectedRequest) return;

        if (reviewStatus === 'rejected' && !rejectionReason.trim()) {
            setError('needReason');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            await disclaimerManagerAPI.reviewRequest(selectedRequest.id, {
                status: reviewStatus,
                manager_notes: managerNotes,
                rejection_reason: rejectionReason,
            });
            setSuccess(
                reviewStatus === 'approved'
                    ? 'successApprove'
                    : 'successReject'
            );
            setShowReviewDialog(false);
            await loadRequests();
        } catch (err) {
            // Display the actual error message from the backend
            const errorMessage = err?.message || err?.error || t('managerPendingRequests.toasts.submitFailed');
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner className="h-12 w-12" />
            </div>
        );
    }

    return (
        <div className="mt-12 mb-8 flex flex-col gap-12">
            <Card>
                <CardBody>
                    <div className="mb-6">
                        <Typography variant="h4" color="blue-gray" className="mb-2">
                            {t('managerPendingRequests.title')}
                        </Typography>
                        <Typography color="gray" className="font-normal">
                            {t('managerPendingRequests.subtitle')}
                        </Typography>
                    </div>

                    {error && (
                        <Alert color="red" className="mb-4" onClose={() => setError(null)}>
                            {/* Display the error directly if it contains ":" or starts with uppercase (likely a message from backend) */}
                            {error.includes(':') || error.includes('Cannot') || error.includes('Employee') || error.length > 50
                                ? error
                                : t(
                                    `managerPendingRequests.toasts.${error}`,
                                    { defaultValue: error }
                                )}
                        </Alert>
                    )}

                    {success && (
                        <Alert color="green" className="mb-4" onClose={() => setSuccess(null)}>
                            {t(`managerPendingRequests.toasts.${success}`)}
                        </Alert>
                    )}

                    {requests.length === 0 ? (
                        <div className="text-center py-12">
                            <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <Typography color="gray" className="mb-2">
                                {t('managerPendingRequests.empty.title')}
                            </Typography>
                            <Typography variant="small" color="gray">
                                {t('managerPendingRequests.empty.body')}
                            </Typography>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request) => (
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
                                                        value={t('managerPendingRequests.chips.step', {
                                                            num: request.step_number,
                                                        })}
                                                        color="blue"
                                                    />
                                                    <Chip
                                                        size="sm"
                                                        value={request.status_display}
                                                        color={disclaimerUtils.getStatusColor(request.status)}
                                                    />
                                                </div>
                                                <div className="space-y-1 text-sm text-gray-600">
                                                    <div>
                                                        {t('managerPendingRequests.fields.employeeId', {
                                                            id: request.employee_id_number,
                                                        })}
                                                    </div>
                                                    <div>
                                                        {t('managerPendingRequests.fields.department', {
                                                            dept: request.employee_department,
                                                        })}
                                                    </div>
                                                    <div>
                                                        {t('managerPendingRequests.fields.submitted', {
                                                            date: disclaimerUtils.formatDate(request.created_at),
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button size="sm" color="blue" onClick={() => handleReviewClick(request)}>
                                                {t('managerPendingRequests.review')}
                                            </Button>
                                        </div>

                                        {request.unreturned_assets_count > 0 && (
                                            <Alert color="amber" className="mt-3 flex items-start gap-3">
                                                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <Typography variant="small" className="font-semibold">
                                                        {t('managerPendingRequests.warnings.unreturnedAssets', {
                                                            count: request.unreturned_assets_count,
                                                            defaultValue: `Warning: Employee has ${request.unreturned_assets_count} unreturned asset(s) from your department`
                                                        })}
                                                    </Typography>
                                                    <Typography variant="small">
                                                        {t('managerPendingRequests.warnings.unreturnedAssetsHelp', {
                                                            defaultValue: 'Please ensure all assets are returned before approving.'
                                                        })}
                                                    </Typography>
                                                </div>
                                            </Alert>
                                        )}

                                        {request.employee_notes && (
                                            <div className="bg-gray-50 p-3 rounded mt-3">
                                                <Typography variant="small" className="font-semibold mb-1">
                                                    {t('managerDisclaimerHistory.employeeNotes')}
                                                </Typography>
                                                <Typography variant="small" color="gray">
                                                    {request.employee_notes}
                                                </Typography>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Review Dialog */}
            <Dialog open={showReviewDialog} handler={() => setShowReviewDialog(false)} size="md">
                <DialogHeader>{t('managerPendingRequests.dialog.title')}</DialogHeader>
                <DialogBody divider className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {selectedRequest && (
                        <>
                            <div className="bg-blue-50 p-4 rounded">
                                <Typography variant="h6" className="mb-2">
                                    {selectedRequest.employee_name}
                                </Typography>
                                <div className="space-y-1 text-sm">
                                    <div>
                                        {t('managerPendingRequests.fields.employeeId', {
                                            id: selectedRequest.employee_id_number,
                                        })}
                                    </div>
                                    <div>
                                        {t('managerPendingRequests.fields.department', {
                                            dept: selectedRequest.employee_department,
                                        })}
                                    </div>
                                    <div>
                                        {t('managerPendingRequests.chips.step', {
                                            num: selectedRequest.step_number,
                                        })}
                                    </div>
                                    <div>
                                        {t('managerPendingRequests.fields.submitted', {
                                            date: disclaimerUtils.formatDate(selectedRequest.created_at),
                                        })}
                                    </div>
                                </div>
                            </div>

                            {selectedRequest.unreturned_assets_count > 0 && (
                                <Alert color="amber" className="flex items-start gap-3">
                                    <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <Typography variant="small" className="font-semibold">
                                            {t('managerPendingRequests.warnings.unreturnedAssets', {
                                                count: selectedRequest.unreturned_assets_count,
                                                defaultValue: `Warning: Employee has ${selectedRequest.unreturned_assets_count} unreturned asset(s) from your department`
                                            })}
                                        </Typography>
                                        <Typography variant="small">
                                            {t('managerPendingRequests.warnings.unreturnedAssetsHelp', {
                                                defaultValue: 'Please ensure all assets are returned before approving.'
                                            })}
                                        </Typography>
                                    </div>
                                </Alert>
                            )}

                            {selectedRequest.employee_notes && (
                                <div>
                                    <Typography variant="small" className="font-semibold mb-2">
                                        {t('managerDisclaimerHistory.employeeNotes')}
                                    </Typography>
                                    <div className="bg-gray-50 p-3 rounded">
                                        <Typography variant="small">{selectedRequest.employee_notes}</Typography>
                                    </div>
                                </div>
                            )}

                            <div>
                                <Typography variant="small" className="font-semibold mb-2">
                                    {t('managerPendingRequests.dialog.decision')}
                                </Typography>
                                <div className="flex gap-4">
                                    <Radio
                                        name="review"
                                        label={
                                            <div className="flex items-center gap-2">
                                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                <span>{t('managerPendingRequests.dialog.approve')}</span>
                                            </div>
                                        }
                                        checked={reviewStatus === 'approved'}
                                        onChange={() => setReviewStatus('approved')}
                                    />
                                    <Radio
                                        name="review"
                                        label={
                                            <div className="flex items-center gap-2">
                                                <XCircleIcon className="h-5 w-5 text-red-500" />
                                                <span>{t('managerPendingRequests.dialog.reject')}</span>
                                            </div>
                                        }
                                        checked={reviewStatus === 'rejected'}
                                        onChange={() => setReviewStatus('rejected')}
                                    />
                                </div>
                            </div>

                            <Textarea
                                label={t('managerPendingRequests.dialog.notesLabel')}
                                value={managerNotes}
                                onChange={(e) => setManagerNotes(e.target.value)}
                                // placeholder={t('managerPendingRequests.dialog.notesPlaceholder')}
                                rows={3}
                            />

                            {reviewStatus === 'rejected' && (
                                <Textarea
                                    label={t('managerPendingRequests.dialog.reasonLabel')}
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={3}
                                    error={reviewStatus === 'rejected' && !rejectionReason.trim()}
                                />
                            )}
                        </>
                    )}
                </DialogBody>
                <DialogFooter className="gap-2">
                    <Button
                        variant="text"
                        color="gray"
                        onClick={() => setShowReviewDialog(false)}
                        disabled={submitting}
                    >
                        {t('managerPendingRequests.dialog.cancel')}
                    </Button>
                    <Button
                        color={reviewStatus === 'approved' ? 'green' : 'red'}
                        onClick={handleSubmitReview}
                        disabled={
                            submitting || 
                            (reviewStatus === 'rejected' && !rejectionReason.trim()) ||
                            (reviewStatus === 'approved' && selectedRequest?.unreturned_assets_count > 0)
                        }
                    >
                        {submitting
                            ? t('managerPendingRequests.dialog.submitting')
                            : reviewStatus === 'approved'
                                ? t('managerPendingRequests.dialog.submitApprove')
                                : t('managerPendingRequests.dialog.submitReject')}
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    );
}
