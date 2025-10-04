// frontend/src/components/FaceRecognitionComponent.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Button,
    Typography,
    Card,
    CardBody,
    Alert,
    Progress,
    Chip
} from "@material-tailwind/react";
import {
    CameraIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";
import { faceRecognitionAPI, cameraUtils } from "@/lib/assetApi";
import { useTranslation } from "react-i18next";

const FaceRecognitionComponent = ({
    open,
    onClose,
    mode = 'register', // 'register' or 'verify'
    employeeId,
    employeeName,
    onSuccess,
    onError
}) => {
    const { t } = useTranslation();

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState('camera'); // 'camera', 'capture', 'processing', 'result'
    const [capturedImage, setCapturedImage] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [cameraReady, setCameraReady] = useState(false);
    const [validationResult, setValidationResult] = useState(null);

    // Cleanup camera stream function
    const cleanupCamera = useCallback(() => {
        console.log('Cleaning up camera...');
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log('Stopped track:', track);
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraReady(false);
    }, []);

    // Initialize camera when modal opens
    useEffect(() => {
        if (open && step === 'camera') {
            initializeCamera();
        }

        // Cleanup when modal closes or component unmounts
        return () => {
            if (open === false) {
                cleanupCamera();
            }
        };
    }, [open, step, cleanupCamera]);

    // Additional cleanup effect for when open changes
    useEffect(() => {
        if (!open) {
            console.log('Modal closed, cleaning up...');
            cleanupCamera();
            resetState();
        }
    }, [open, cleanupCamera]);

    const resetState = useCallback(() => {
        setStep('camera');
        setCapturedImage(null);
        setResult(null);
        setError('');
        setCameraReady(false);
        setValidationResult(null);
        setIsLoading(false);
    }, []);

    const initializeCamera = async () => {
        try {
            setIsLoading(true);
            setError('');

            // Clean up any existing stream first
            cleanupCamera();

            // Check if camera is available
            const isAvailable = await cameraUtils.isCameraAvailable();
            if (!isAvailable) {
                throw new Error('No camera found on this device');
            }

            // Start camera with a small delay to ensure cleanup is complete
            await new Promise(resolve => setTimeout(resolve, 100));

            const constraints = cameraUtils.getOptimalConstraints();
            const cameraStream = await faceRecognitionAPI.startCamera(constraints);

            // Store stream reference
            streamRef.current = cameraStream;

            // Set video stream
            if (videoRef.current && cameraStream) {
                videoRef.current.srcObject = cameraStream;
                videoRef.current.onloadedmetadata = () => {
                    setCameraReady(true);
                    setIsLoading(false);
                };
                videoRef.current.onerror = (err) => {
                    console.error('Video error:', err);
                    setError(t('faceComponent.errors.displayFeedFailed', 'Failed to display camera feed'));
                    setIsLoading(false);
                };
            }
        } catch (err) {
            console.error('Camera initialization error:', err);
            setError(err.message || t('faceComponent.errors.accessCameraFailed', 'Failed to access camera'));
            setIsLoading(false);
            cleanupCamera();
        }
    };

    const captureImage = async () => {
        try {
            if (!videoRef.current || !cameraReady) {
                throw new Error(t('faceComponent.errors.cameraNotReady', 'Camera not ready'));
            }

            setIsLoading(true);
            setStep('processing');

            // Capture image from video
            const imageData = await faceRecognitionAPI.captureImageFromVideo(videoRef.current);
            setCapturedImage(imageData);

            // Validate image quality
            const validation = await faceRecognitionAPI.validateImageQuality(imageData);
            setValidationResult(validation);

            if (!validation.is_valid) {
                setStep('capture');
                setIsLoading(false);
                return;
            }

            // Process based on mode
            if (mode === 'register') {
                await registerFace(imageData);
            } else {
                await verifyFace(imageData);
            }
        } catch (err) {
            console.error('Capture error:', err);
            setError(err.message || t('faceComponent.errors.captureFailed', 'Failed to capture image'));
            setStep('capture');
            setIsLoading(false);
        }
    };

    const registerFace = async (imageData) => {
        try {
            const response = await faceRecognitionAPI.registerEmployeeFace(employeeId, imageData);
            setResult(response);
            setStep('result');

            if (response.success && onSuccess) {
                onSuccess(response);
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || t('employees.profile.errors.faceFailed', 'Face registration failed'));
            if (onError) onError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const verifyFace = async (imageData) => {
        try {
            const response = await faceRecognitionAPI.verifyEmployeeFace(employeeId, imageData);
            setResult(response);
            setStep('result');

            // Include the captured image data in the response for transaction use
            if (response.success && onSuccess) {
                onSuccess({
                    ...response,
                    face_image_data: imageData, // Pass the actual image data
                    capturedImage: imageData
                });
            } else if (!response.success && onError) {
                onError({
                    ...response,
                    face_image_data: imageData // Pass image data even on failure for debugging
                });
            }
        } catch (err) {
            console.error('Verification error:', err);
            setError(err.message || t('transactionsPage.errors.faceFailed', 'Face verification failed'));
            if (onError) onError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = useCallback(() => {
        console.log('Handle close called');
        cleanupCamera();
        resetState();
        if (onClose) {
            onClose();
        }
    }, [cleanupCamera, resetState, onClose]);

    const retakePhoto = () => {
        setCapturedImage(null);
        setValidationResult(null);
        setStep('camera');
        setError('');
        // Reinitialize camera
        setTimeout(() => {
            initializeCamera();
        }, 100);
    };

    const renderCameraView = () => (
        <div className="space-y-4">
            <div className="relative">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full max-w-md mx-auto rounded-lg border-2 border-gray-300"
                    style={{ transform: 'scaleX(-1)' }} // Mirror effect
                />
                {!cameraReady && (
                    <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                            <CameraIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                            <Typography className="text-gray-600">
                                {isLoading ? t('faceComponent.startingCamera', 'Starting camera...') : t('faceComponent.cameraNotReady', 'Camera not ready')}
                            </Typography>
                        </div>
                    </div>
                )}

                {/* Face guide overlay */}
                {cameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="border-2 border-blue-500 border-dashed rounded-full w-48 h-48 opacity-50"></div>
                    </div>
                )}
            </div>

            <Typography className="text-center text-sm text-gray-600">
                {t('faceComponent.positionFace', 'Position your face within the circle and click capture')}
            </Typography>
        </div>
    );

    const renderValidationIssues = () => (
        validationResult && !validationResult.is_valid && (
            <Alert color="amber" className="mb-4">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <div>
                    <Typography variant="h6" className="mb-1">
                        {t('faceComponent.imageQualityIssues', 'Image Quality Issues:')}
                    </Typography>
                    <ul className="list-disc list-inside text-sm">
                        {validationResult.issues.map((issue, index) => (
                            <li key={index}>{issue}</li>
                        ))}
                    </ul>
                    <Typography variant="small" className="mt-2 font-semibold">
                        {t('faceComponent.recommendations', 'Recommendations:')}
                    </Typography>
                    <ul className="list-disc list-inside text-sm">
                        {validationResult.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                        ))}
                    </ul>
                </div>
            </Alert>
        )
    );

    const renderResult = () => (
        <div className="text-center space-y-4">
            {capturedImage && (
                <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-48 h-48 mx-auto rounded-lg border object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                />
            )}

            {result && (
                <Card className="max-w-md mx-auto">
                    <CardBody className="text-center">
                        {result.success ? (
                            <div className="space-y-3">
                                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
                                <Typography variant="h5" color="green">
                                    {mode === 'register'
                                        ? t('faceComponent.registrationSuccessful', 'Registration Successful!')
                                        : t('faceComponent.verificationSuccessful', 'Verification Successful!')}
                                </Typography>

                                {mode === 'verify' && result.confidence && (
                                    <div className="space-y-2">
                                        <Typography variant="small" color="gray">
                                            {t('faceComponent.confidenceScore', 'Confidence Score')}
                                        </Typography>
                                        <Progress
                                            value={result.confidence * 100}
                                            color={result.confidence > 0.8 ? "green" : result.confidence > 0.6 ? "yellow" : "red"}
                                            className="w-full"
                                        />
                                        <Typography variant="small">
                                            {(result.confidence * 100).toFixed(1)}%
                                        </Typography>
                                    </div>
                                )}

                                {mode === 'register' && result.quality_score && (
                                    <div>
                                        <Typography variant="small" color="gray">
                                            {t('faceComponent.imageQualityScore', 'Image Quality Score')}: {(result.quality_score * 100).toFixed(1)}%
                                        </Typography>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <XCircleIcon className="h-16 w-16 text-red-500 mx-auto" />
                                <Typography variant="h5" color="red">
                                    {mode === 'register'
                                        ? t('faceComponent.registrationFailed', 'Registration Failed')
                                        : t('faceComponent.verificationFailed', 'Verification Failed')}
                                </Typography>

                                {result.error && (
                                    <Typography variant="small" color="gray">
                                        {result.error}
                                    </Typography>
                                )}

                                {mode === 'verify' && result.confidence && (
                                    <div className="space-y-2">
                                        <Typography variant="small" color="gray">
                                            {t('faceComponent.confidenceScore', 'Confidence Score')}
                                        </Typography>
                                        <Progress
                                            value={result.confidence * 100}
                                            color="red"
                                            className="w-full"
                                        />
                                        <Typography variant="small">
                                            {(result.confidence * 100).toFixed(1)}% ({t('faceComponent.threshold', 'Threshold')}: {((result.threshold || 0.6) * 100).toFixed(0)}%)
                                        </Typography>
                                    </div>
                                )}

                                {result.issues && result.issues.length > 0 && (
                                    <div>
                                        <Typography variant="small" className="font-semibold mb-1">
                                            {t('faceComponent.issues', 'Issues:')}
                                        </Typography>
                                        <ul className="list-disc list-inside text-xs text-left">
                                            {result.issues.map((issue, index) => (
                                                <li key={index}>{issue}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}
        </div>
    );

    // Don't render if not open
    if (!open) {
        return null;
    }

    return (
        <Dialog
            open={open}
            handler={handleClose}
            size="lg"
            className="max-w-2xl"
            dismiss={{ enabled: false }} // Prevent accidental closes
        >
            <DialogHeader className="flex items-center gap-2">
                <CameraIcon className="h-6 w-6" />
                {mode === 'register'
                    ? t('faceComponent.titleRegister', 'Face Registration')
                    : t('faceComponent.titleVerify', 'Face Verification')}
                {employeeName && (
                    <Chip variant="outlined" value={employeeName} className="ml-2" />
                )}
            </DialogHeader>

            <DialogBody className="max-h-[70vh] overflow-y-auto">
                {error && (
                    <Alert color="red" className="mb-4">
                        <XCircleIcon className="h-5 w-5" />
                        {error}
                    </Alert>
                )}

                {step === 'camera' && renderCameraView()}
                {step === 'capture' && (
                    <div className="space-y-4">
                        {capturedImage && (
                            <img
                                src={capturedImage}
                                alt="Captured"
                                className="w-48 h-48 mx-auto rounded-lg border object-cover"
                                style={{ transform: 'scaleX(-1)' }}
                            />
                        )}
                        {renderValidationIssues()}
                    </div>
                )}
                {step === 'processing' && (
                    <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
                        <Typography>
                            {mode === 'register'
                                ? t('faceComponent.processingRegistration', 'Processing registration...')
                                : t('faceComponent.processingVerification', 'Processing verification...')}
                        </Typography>
                    </div>
                )}
                {step === 'result' && renderResult()}
            </DialogBody>

            <DialogFooter className="flex justify-between">
                <Button variant="text" color="red" onClick={handleClose}>
                    {t('actions.close')}
                </Button>

                <div className="flex gap-2">
                    {step === 'camera' && (
                        <Button
                            onClick={captureImage}
                            disabled={!cameraReady || isLoading}
                            loading={isLoading}
                        >
                            {t('faceComponent.capturePhoto', 'Capture Photo')}
                        </Button>
                    )}

                    {step === 'capture' && (
                        <>
                            <Button variant="outlined" onClick={retakePhoto}>
                                {t('faceComponent.retake', 'Retake')}
                            </Button>
                            {validationResult?.is_valid && (
                                <Button onClick={() => setStep('processing')}>
                                    {t('faceComponent.continue', 'Continue')}
                                </Button>
                            )}
                        </>
                    )}

                    {step === 'result' && !result?.success && (
                        <Button variant="outlined" onClick={retakePhoto}>
                            {t('actions.tryAgain')}
                        </Button>
                    )}
                </div>
            </DialogFooter>
        </Dialog>
    );
};

export default FaceRecognitionComponent;
