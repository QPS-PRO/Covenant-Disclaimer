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
    Chip
} from '@material-tailwind/react';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import { disclaimerManagerAPI, disclaimerUtils } from '@/lib/disclaimerApi';

export default function ManagerPendingRequests() {
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
            setError(err.message || 'Failed to load pending requests');
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
            setError('Rejection reason is required when rejecting a request');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            await disclaimerManagerAPI.reviewRequest(selectedRequest.id, {
                status: reviewStatus,
                manager_notes: managerNotes,
                rejection_reason: rejectionReason
            });
            setSuccess(`Request ${reviewStatus === 'approved' ? 'approved' : 'rejected'} successfully!`);
            setShowReviewDialog(false);
            await loadRequests();
        } catch (err) {
            setError(err.message || 'Failed to submit review');
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
                            Pending Disclaimer Requests
                        </Typography>
                        <Typography color="gray" className="font-normal">
                            Review and approve or reject disclaimer clearance requests
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

                    {requests.length === 0 ? (
                        <div className="text-center py-12">
                            <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <Typography color="gray" className="mb-2">
                                No pending requests
                            </Typography>
                            <Typography variant="small" color="gray">
                                All disclaimer requests have been reviewed
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
                                                        value={`Step ${request.step_number}`}
                                                        color="blue"
                                                    />
                                                    <Chip
                                                        size="sm"
                                                        value={request.status_display}
                                                        color={disclaimerUtils.getStatusColor(request.status)}
                                                    />
                                                </div>
                                                <div className="space-y-1 text-sm text-gray-600">
                                                    <div>Employee ID: {request.employee_id_number}</div>
                                                    <div>Department: {request.employee_department}</div>
                                                    <div>Submitted: {disclaimerUtils.formatDate(request.created_at)}</div>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                color="blue"
                                                onClick={() => handleReviewClick(request)}
                                            >
                                                Review
                                            </Button>
                                        </div>

                                        {request.employee_notes && (
                                            <div className="bg-gray-50 p-3 rounded mt-3">
                                                <Typography variant="small" className="font-semibold mb-1">
                                                    Employee Notes:
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
                <DialogHeader>
                    Review Disclaimer Request
                </DialogHeader>
                <DialogBody divider className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {selectedRequest && (
                        <>
                            <div className="bg-blue-50 p-4 rounded">
                                <Typography variant="h6" className="mb-2">
                                    {selectedRequest.employee_name}
                                </Typography>
                                <div className="space-y-1 text-sm">
                                    <div>Employee ID: {selectedRequest.employee_id_number}</div>
                                    <div>Department: {selectedRequest.employee_department}</div>
                                    <div>Step: {selectedRequest.step_number}</div>
                                    <div>Submitted: {disclaimerUtils.formatDate(selectedRequest.created_at)}</div>
                                </div>
                            </div>

                            {selectedRequest.employee_notes && (
                                <div>
                                    <Typography variant="small" className="font-semibold mb-2">
                                        Employee Notes:
                                    </Typography>
                                    <div className="bg-gray-50 p-3 rounded">
                                        <Typography variant="small">
                                            {selectedRequest.employee_notes}
                                        </Typography>
                                    </div>
                                </div>
                            )}

                            <div>
                                <Typography variant="small" className="font-semibold mb-2">
                                    Decision *
                                </Typography>
                                <div className="flex gap-4">
                                    <Radio
                                        name="review"
                                        label={
                                            <div className="flex items-center gap-2">
                                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                <span>Approve</span>
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
                                                <span>Reject</span>
                                            </div>
                                        }
                                        checked={reviewStatus === 'rejected'}
                                        onChange={() => setReviewStatus('rejected')}
                                    />
                                </div>
                            </div>

                            <Textarea
                                label="Manager Notes (Optional)"
                                value={managerNotes}
                                onChange={(e) => setManagerNotes(e.target.value)}
                                placeholder="Add any comments or feedback..."
                                rows={3}
                            />

                            {reviewStatus === 'rejected' && (
                                <Textarea
                                    label="Rejection Reason *"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Please provide a clear reason for rejection..."
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
                        Cancel
                    </Button>
                    <Button
                        color={reviewStatus === 'approved' ? 'green' : 'red'}
                        onClick={handleSubmitReview}
                        disabled={submitting || (reviewStatus === 'rejected' && !rejectionReason.trim())}
                    >
                        {submitting ? 'Submitting...' : reviewStatus === 'approved' ? 'Approve' : 'Reject'}
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    );
}