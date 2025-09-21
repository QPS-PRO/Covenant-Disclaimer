// frontend/src/components/AssetReturnComponent.jsx
import React, { useState, useCallback } from 'react';
import {
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Button,
    Select,
    Option,
    Textarea,
    Typography,
    Alert,
    Card,
    CardBody,
    Chip,
} from '@material-tailwind/react';
import {
    ArrowPathIcon,
    CameraIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { assetReturnAPI } from '@/lib/assetApi';
import FaceRecognitionComponent from './FaceRecognitionComponent';

const AssetReturnComponent = ({
    open,
    onClose,
    asset,
    employee,
    onSuccess,
    onError,
}) => {
    const [step, setStep] = useState('form'); // 'form' | 'face_verification' | 'processing'
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        return_condition: '',
        damage_notes: '',
        notes: '',
    });
    const [faceVerificationResult, setFaceVerificationResult] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFormSubmit = () => {
        if (!formData.return_condition) {
            onError({ error: 'Please select asset condition' });
            return;
        }

        // Validate damage notes for damaged/poor/broken conditions
        if (['Damaged', 'Broken', 'Poor'].includes(formData.return_condition) && !formData.damage_notes) {
            onError({ error: 'Please provide damage description for this condition' });
            return;
        }

        // Check if employee has face data and needs verification
        if (employee?.has_face_data) {
            setStep('face_verification');
        } else {
            // Process return without face verification
            handleProcessReturn(null);
        }
    };

    const handleProcessReturn = async (verificationResult) => {
        try {
            setStep('processing');
            setLoading(true);
            setFaceVerificationResult(verificationResult);

            console.log('Processing return with data:', {
                assetId: asset.id,
                employeeId: employee.id,
                formData,
                hasVerification: !!verificationResult
            });

            // Use the asset return API endpoint
            const response = await assetReturnAPI.processReturn(
                asset.id,
                employee.id,
                formData,
                verificationResult?.face_data || null
            );

            console.log('Return response:', response);

            // Success callback
            onSuccess({
                transaction: response.transaction,
                asset: response.asset,
                employee,
                verification: verificationResult,
                message: response.message
            });

            // Reset form
            handleClose();

        } catch (error) {
            console.error('Error processing return:', error);

            // Extract detailed error message
            let errorMessage = 'Failed to process asset return';
            let errorDetails = error.message;

            if (error.response?.data) {
                errorMessage = error.response.data.error || errorMessage;
                errorDetails = error.response.data.details || error.response.data.detail || errorDetails;
            }

            onError({
                error: errorMessage,
                details: errorDetails,
            });
            setStep('form');
        } finally {
            setLoading(false);
        }
    };

    const handleFaceVerificationSuccess = useCallback(async (verificationResult) => {
        console.log('Face verification successful:', verificationResult);
        await handleProcessReturn(verificationResult);
    }, [asset, employee, formData, onSuccess, onError]);

    const handleFaceVerificationError = useCallback((error) => {
        console.error('Face verification failed:', error);
        onError({
            error: 'Face verification failed',
            details: error.error || 'Unknown error',
        });
        setStep('form');
    }, [onError]);

    const handleClose = useCallback(() => {
        setStep('form');
        setFormData({
            return_condition: '',
            damage_notes: '',
            notes: '',
        });
        setFaceVerificationResult(null);
        setLoading(false);
        onClose();
    }, [onClose]);

    const renderFormStep = () => (
        <>
            <DialogHeader className="flex items-center gap-2">
                <ArrowPathIcon className="h-6 w-6 text-orange-500" />
                Return Asset: {asset?.name}
            </DialogHeader>

            <DialogBody className="space-y-4">
                <Alert color="blue" className="mb-4">
                    <Typography variant="small">
                        Please provide the asset condition and any additional notes.
                        {employee?.has_face_data
                            ? " Face verification will be required to complete the return."
                            : " No face verification is required for this employee."
                        }
                    </Typography>
                </Alert>

                {/* Asset Information */}
                <Card className="bg-blue-gray-50">
                    <CardBody className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Typography variant="small" color="gray" className="font-semibold">
                                    Asset Name:
                                </Typography>
                                <Typography variant="small" color="blue-gray">
                                    {asset?.name}
                                </Typography>
                            </div>
                            <div>
                                <Typography variant="small" color="gray" className="font-semibold">
                                    Serial Number:
                                </Typography>
                                <Typography variant="small" color="blue-gray">
                                    {asset?.serial_number}
                                </Typography>
                            </div>
                            <div>
                                <Typography variant="small" color="gray" className="font-semibold">
                                    Employee:
                                </Typography>
                                <Typography variant="small" color="blue-gray">
                                    {employee?.name}
                                </Typography>
                            </div>
                            <div>
                                <Typography variant="small" color="gray" className="font-semibold">
                                    Employee ID:
                                </Typography>
                                <Typography variant="small" color="blue-gray">
                                    {employee?.employee_id}
                                </Typography>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Return Form */}
                <div className="space-y-4">
                    <Select
                        label="Asset Condition *"
                        value={formData.return_condition}
                        onChange={(value) => setFormData(prev => ({ ...prev, return_condition: value }))}
                        required
                    >
                        <Option value="">Select Condition</Option>
                        <Option value="Excellent">Excellent - Like new</Option>
                        <Option value="Good">Good - No issues</Option>
                        <Option value="Fair">Fair - Minor wear</Option>
                        <Option value="Poor">Poor - Significant wear</Option>
                        <Option value="Damaged">Damaged - Needs repair</Option>
                        <Option value="Broken">Broken - Not functional</Option>
                    </Select>

                    {(formData.return_condition === 'Damaged' ||
                        formData.return_condition === 'Broken' ||
                        formData.return_condition === 'Poor') && (
                            <>
                                <Alert color="amber" icon={<ExclamationTriangleIcon className="h-6 w-6" />}>
                                    <Typography variant="small">
                                        This asset condition requires detailed damage description.
                                    </Typography>
                                </Alert>

                                <Textarea
                                    label="Damage Description *"
                                    name="damage_notes"
                                    value={formData.damage_notes}
                                    onChange={handleInputChange}
                                    placeholder="Describe the damage or issues with the asset in detail..."
                                    rows={3}
                                    required
                                />
                            </>
                        )}

                    <Textarea
                        label="Additional Notes (Optional)"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Any additional information about the return..."
                        rows={2}
                    />
                </div>
            </DialogBody>

            <DialogFooter>
                <Button variant="text" color="red" onClick={handleClose} className="mr-1">
                    Cancel
                </Button>
                <Button
                    onClick={handleFormSubmit}
                    disabled={!formData.return_condition ||
                        ((formData.return_condition === 'Damaged' ||
                            formData.return_condition === 'Broken' ||
                            formData.return_condition === 'Poor') &&
                            !formData.damage_notes)}
                    className="flex items-center gap-2"
                >
                    {employee?.has_face_data ? (
                        <>
                            <CameraIcon className="h-4 w-4" />
                            Proceed to Face Verification
                        </>
                    ) : (
                        <>
                            <CheckCircleIcon className="h-4 w-4" />
                            Process Return
                        </>
                    )}
                </Button>
            </DialogFooter>
        </>
    );

    const renderProcessingStep = () => (
        <>
            <DialogHeader>
                <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                    Processing Return...
                </div>
            </DialogHeader>

            <DialogBody className="text-center py-8">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <Typography variant="h6" color="blue-gray">
                        Processing asset return...
                    </Typography>
                    <Typography variant="small" color="gray">
                        Please wait while we complete the transaction.
                    </Typography>

                    {faceVerificationResult && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                <Typography variant="small" color="green" className="font-semibold">
                                    Face Verification Successful
                                </Typography>
                            </div>
                            <Typography variant="small" color="gray">
                                Confidence: {(faceVerificationResult.confidence * 100).toFixed(1)}%
                            </Typography>
                        </div>
                    )}
                </div>
            </DialogBody>
        </>
    );

    if (!asset || !employee) {
        return null;
    }

    return (
        <>
            {/* Return Form Dialog */}
            <Dialog
                open={open && (step === 'form' || step === 'processing')}
                handler={handleClose}
                size="lg"
                dismiss={{ enabled: step !== 'processing' }}
            >
                {step === 'form' && renderFormStep()}
                {step === 'processing' && renderProcessingStep()}
            </Dialog>

            {/* Face Recognition Dialog */}
            {employee?.has_face_data && (
                <FaceRecognitionComponent
                    open={step === 'face_verification'}
                    mode="verify"
                    employeeId={employee.id}
                    employeeName={employee.name}
                    onClose={handleClose}
                    onSuccess={handleFaceVerificationSuccess}
                    onError={handleFaceVerificationError}
                    title={`Verify Identity - Returning ${asset.name}`}
                    description="Please verify your identity to complete the asset return process."
                />
            )}
        </>
    );
};

export default AssetReturnComponent;