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

    // Translation mapper for backend validation messages
    const translateValidationMessage = useCallback((message) => {
        if (!message) return message;
        
        // Map backend messages to translation keys
        const messageMap = {
            // Issues
            'No face detected in image': t('faceComponent.validationIssues.noFaceDetected'),
            'Low overall image quality': t('faceComponent.validationIssues.lowQuality'),
            'Image is too blurry': t('faceComponent.validationIssues.tooBlurry'),
            'Poor lighting conditions': t('faceComponent.validationIssues.poorLighting'),
            'Face is too small': t('faceComponent.validationIssues.faceTooSmall'),
            'Face takes up too little of the image': t('faceComponent.validationIssues.faceTooFar'),
            'Face is too close to camera': t('faceComponent.validationIssues.faceTooClose'),
            'Face is not centered': t('faceComponent.validationIssues.faceNotCentered'),
            'Face appears incomplete - too narrow': t('faceComponent.validationIssues.faceIncompleteNarrow'),
            'Face appears incomplete - too wide': t('faceComponent.validationIssues.faceIncompleteWide'),
            'Image validation failed': t('faceComponent.validationIssues.validationFailed'),
            
            // Recommendations
            'Ensure face is clearly visible': t('faceComponent.validationRecommendations.ensureFaceVisible'),
            'Use good lighting': t('faceComponent.validationRecommendations.useGoodLighting'),
            'Face the camera directly': t('faceComponent.validationRecommendations.faceCamera'),
            'Use better lighting and ensure face is clear': t('faceComponent.validationRecommendations.betterLighting'),
            'Keep camera steady and ensure good focus': t('faceComponent.validationRecommendations.keepSteady'),
            'Use good, even lighting on face': t('faceComponent.validationRecommendations.evenLighting'),
            'Move closer to the camera': t('faceComponent.validationRecommendations.moveCloser'),
            'Move back from the camera - entire face should be visible': t('faceComponent.validationRecommendations.moveBack'),
            'Center your face and move closer to camera': t('faceComponent.validationRecommendations.centerFace'),
            'Center your face in the frame - position yourself in the middle': t('faceComponent.validationRecommendations.centerInFrame'),
            'Remove any obstructions': t('faceComponent.validationRecommendations.removeObstructions'),
            'Ensure only ONE face is visible in the frame': t('faceComponent.validationRecommendations.onlyOneFace'),
            'Ensure ENTIRE face is visible - move to show full face from forehead to chin': t('faceComponent.validationRecommendations.showFullFaceVertical'),
            'Ensure ENTIRE face is visible - move to show full face including both sides': t('faceComponent.validationRecommendations.showFullFaceHorizontal'),
            'Please try again with a clear image': t('faceComponent.validationRecommendations.tryAgain'),
        };
        
        // Check for exact match
        if (messageMap[message]) {
            return messageMap[message];
        }
        
        // Check for partial matches (for messages with dynamic values)
        for (const [key, value] of Object.entries(messageMap)) {
            if (message.includes(key) || message.startsWith(key.split('(')[0])) {
                return value;
            }
        }
        
        // Return original message if no translation found
        return message;
    }, [t]);

    // Cleanup camera stream function
    const cleanupCamera = useCallback(() => {
        // console.log('Cleaning up camera...');
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                // console.log('Stopped track:', track);
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
            // console.log('Modal closed, cleaning up...');
            cleanupCamera();
            resetState();
        }
        
        // Safety: Also cleanup when modal closes AND when component unmounts
        return () => {
            cleanupCamera();
        };
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
                    // console.error('Video error:', err);
                    setError(t('faceComponent.errors.displayFeedFailed', 'Failed to display camera feed'));
                    setIsLoading(false);
                };
            }
        } catch (err) {
            // console.error('Camera initialization error:', err);
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

            // Clean up camera immediately after capture
            // console.log('Image captured, cleaning up camera...');
            cleanupCamera();

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
            // console.error('Capture error:', err);
            setError(err.message || t('faceComponent.errors.captureFailed', 'Failed to capture image'));
            setStep('capture');
            setIsLoading(false);
            // Also cleanup camera on error
            cleanupCamera();
        }
    };

    const registerFace = async (imageData) => {
        try {
            const response = await faceRecognitionAPI.registerEmployeeFace(employeeId, imageData);
            setResult(response);
            setStep('result');

            if (response.success && onSuccess) {
                // CRITICAL: Ensure camera is fully stopped IMMEDIATELY after success
                cleanupCamera();
                
                // Auto-close modal after successful registration
                setTimeout(() => {
                    handleClose();
                }, 2000); // Close after 2 seconds to show success message
                
                onSuccess(response);
            }
        } catch (err) {
            // console.error('Registration error:', err);
            cleanupCamera(); // Ensure camera stops even on error
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

            // CRITICAL: Ensure camera is fully stopped IMMEDIATELY after verification (success or failure)
            cleanupCamera();

            // Include the captured image data in the response for transaction use
            if (response.success && onSuccess) {
                // Auto-close modal after successful verification
                setTimeout(() => {
                    handleClose();
                }, 1500); // Close after 1.5 seconds to show success message
                
                onSuccess({
                    ...response,
                    face_image_data: imageData, // Pass the actual image data
                    capturedImage: imageData
                });
            } else if (!response.success && onError) {
                // Camera already cleaned up above
                onError({
                    ...response,
                    face_image_data: imageData // Pass image data even on failure for debugging
                });
            }
        } catch (err) {
            // console.error('Verification error:', err);
            cleanupCamera(); // Ensure camera stops even on exception
            setError(err.message || t('transactionsPage.errors.faceFailed', 'Face verification failed'));
            if (onError) onError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = useCallback(() => {
        // console.log('Handle close called');
        cleanupCamera();
        resetState();
        if (onClose) {
            onClose();
        }
    }, [cleanupCamera, resetState, onClose]);

    const retakePhoto = () => {
        // console.log('Retaking photo, cleaning up and reinitializing camera...');
        cleanupCamera();
        
        setCapturedImage(null);
        setValidationResult(null);
        setStep('camera');
        setError('');
        
        // Reinitialize camera after a short delay
        setTimeout(() => {
            initializeCamera();
        }, 200);
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

            <Alert color="blue" className="text-sm">
                <Typography variant="small" className="font-semibold mb-2">
                    {t('faceComponent.captureTips', 'Capture Tips:')}
                </Typography>
                <ul className="list-disc list-inside text-xs space-y-1">
                    <li>{t('faceComponent.captureTipsList.tip1', 'Position your face within the circle')}</li>
                    <li>{t('faceComponent.captureTipsList.tip2', 'Ensure good, even lighting on your face')}</li>
                    <li>{t('faceComponent.captureTipsList.tip3', 'Face the camera directly and keep still')}</li>
                    <li>{t('faceComponent.captureTipsList.tip4', 'Remove glasses or items that obscure your face')}</li>
                    <li>{t('faceComponent.captureTipsList.tip5', 'Move closer if needed (face should be clearly visible)')}</li>
                </ul>
            </Alert>
        </div>
    );

    const renderValidationIssues = () => (
        validationResult && !validationResult.is_valid && (
            <Alert color="amber" className="mb-4">
                <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                        <Typography variant="h6" className="mb-2">
                            {t('faceComponent.imageQualityIssues', 'Image Quality Issues:')}
                        </Typography>
                        
                        {/* Quality Score */}
                        {validationResult.quality_score !== undefined && (
                            <div className="mb-3 p-2 bg-white/50 rounded">
                                <Typography variant="small" className="font-semibold mb-1">
                                    {t('faceComponent.overallQuality', 'Overall Quality Score:')} {(validationResult.quality_score * 100).toFixed(1)}%
                                </Typography>
                                <Progress 
                                    value={validationResult.quality_score * 100} 
                                    color={validationResult.quality_score > 0.6 ? "green" : validationResult.quality_score > 0.4 ? "yellow" : "red"}
                                    className="h-2"
                                />
                            </div>
                        )}
                        
                        <Typography variant="small" className="font-semibold mb-1">
                            {t('faceComponent.detectedIssues', 'Detected Issues:')}
                        </Typography>
                        <ul className="list-disc list-inside text-sm mb-3 space-y-1">
                            {validationResult.issues.map((issue, index) => (
                                <li key={index} className="text-gray-800">{translateValidationMessage(issue)}</li>
                            ))}
                        </ul>
                        
                        <Typography variant="small" className="font-semibold mb-1 text-blue-900">
                            {t('faceComponent.recommendations', 'Recommendations:')}
                        </Typography>
                        <ul className="list-disc list-inside text-sm space-y-1">
                            {validationResult.recommendations.map((rec, index) => (
                                <li key={index} className="text-blue-800">{translateValidationMessage(rec)}</li>
                            ))}
                        </ul>
                    </div>
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
                                                <li key={index}>{translateValidationMessage(issue)}</li>
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
