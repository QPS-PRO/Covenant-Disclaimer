// frontend/src/lib/cameraManager.js
// Utility to manage camera state and prevent conflicts

class CameraManager {
    constructor() {
        this.activeStream = null;
        this.isActive = false;
    }

    async startCamera(constraints = null) {
        // Stop any existing stream first
        this.stopCamera();

        const defaultConstraints = {
            video: {
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
                facingMode: 'user',
                frameRate: { ideal: 30, min: 15 }
            },
            audio: false
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(
                constraints || defaultConstraints
            );

            this.activeStream = stream;
            this.isActive = true;

            console.log('Camera started successfully');
            return stream;
        } catch (error) {
            console.error('Failed to start camera:', error);
            this.activeStream = null;
            this.isActive = false;
            throw error;
        }
    }

    stopCamera() {
        if (this.activeStream) {
            console.log('Stopping camera stream...');
            this.activeStream.getTracks().forEach(track => {
                track.stop();
                console.log('Stopped track:', track.kind);
            });
            this.activeStream = null;
            this.isActive = false;
            console.log('Camera stopped successfully');
        }
    }

    getActiveStream() {
        return this.activeStream;
    }

    isStreamActive() {
        return this.isActive && this.activeStream &&
            this.activeStream.getTracks().some(track => track.readyState === 'live');
    }

    async checkCameraAvailability() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            return videoDevices.length > 0;
        } catch (error) {
            console.error('Error checking camera availability:', error);
            return false;
        }
    }

    async getAvailableCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('Error getting available cameras:', error);
            return [];
        }
    }

    // Cleanup method to be called when app unmounts or navigates away
    cleanup() {
        this.stopCamera();
    }
}

// Create a singleton instance
const cameraManager = new CameraManager();

// Ensure cleanup on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        cameraManager.cleanup();
    });

    // Also cleanup on visibility change (when tab becomes hidden)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cameraManager.stopCamera();
        }
    });
}

export default cameraManager;