import cv2
import numpy as np
import face_recognition
import base64
import io
from PIL import Image
import json
import logging
from typing import Dict, List, Tuple, Optional
from django.conf import settings
import os
from django.utils import timezone

logger = logging.getLogger(__name__)


class FaceRecognitionService:
    """
    Face Recognition Service using face_recognition library (built on dlib)
    Handles face encoding, comparison, and verification
    """

    def __init__(self):
        self.tolerance = getattr(settings, "FACE_RECOGNITION_TOLERANCE", 0.6)
        self.model = getattr(
            settings, "FACE_RECOGNITION_MODEL", "hog"
        )  # 'hog' or 'cnn'
        
        # Load quality thresholds from settings
        self.quality_thresholds = getattr(settings, "FACE_QUALITY_THRESHOLDS", {
            'min_quality_score': 0.35,
            'min_sharpness': 25.0,
            'min_brightness': 60.0,
            'max_brightness': 220.0,
            'min_face_size': 80,
            'min_face_ratio': 0.03,
        })

    def encode_face_from_base64(self, base64_image: str) -> Optional[Dict]:
        """
        Extract face encoding from base64 image string

        Args:
            base64_image: Base64 encoded image string

        Returns:
            Dict with face encoding and metadata or None if no face found
        """
        try:
            # Remove data URL prefix if present
            if base64_image.startswith("data:image"):
                base64_image = base64_image.split(",")[1]

            # Decode base64 image
            image_data = base64.b64decode(base64_image)
            image = Image.open(io.BytesIO(image_data))

            # Convert PIL image to numpy array (RGB format for face_recognition)
            image_array = np.array(image)

            # Convert RGBA to RGB if necessary
            if image_array.shape[2] == 4:
                image_array = cv2.cvtColor(image_array, cv2.COLOR_RGBA2RGB)
            elif len(image_array.shape) == 3 and image_array.shape[2] == 3:
                # Ensure RGB format (face_recognition expects RGB)
                image_array = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)

            # Find face locations
            face_locations = face_recognition.face_locations(
                image_array, model=self.model
            )

            if not face_locations:
                logger.warning("No face found in the provided image")
                return None

            if len(face_locations) > 1:
                logger.warning(
                    f"Multiple faces found ({len(face_locations)}), using the largest one"
                )
                # Use the largest face (by area)
                face_locations = [
                    max(
                        face_locations,
                        key=lambda loc: (loc[2] - loc[0]) * (loc[1] - loc[3]),
                    )
                ]

            # Get face encoding
            face_encodings = face_recognition.face_encodings(
                image_array,
                face_locations,
                model="large",  # Use large model for better accuracy
            )

            if not face_encodings:
                logger.warning("Could not encode the face in the image")
                return None

            face_encoding = face_encodings[0]

            # Calculate face quality metrics
            face_location = face_locations[0]
            face_area = (face_location[2] - face_location[0]) * (
                face_location[1] - face_location[3]
            )
            image_area = image_array.shape[0] * image_array.shape[1]
            face_ratio = face_area / image_area

            # Quality assessment
            quality = self._assess_face_quality(image_array, face_location, face_ratio)

            return {
                "encoding": face_encoding.tolist(),  # Convert numpy array to list for JSON serialization
                "face_location": face_location,
                "face_ratio": face_ratio,
                "quality": quality,
                "image_dimensions": {
                    "width": image_array.shape[1],
                    "height": image_array.shape[0],
                },
            }

        except Exception as e:
            logger.error(f"Error encoding face: {str(e)}")
            return None

    def _assess_face_quality(
        self, image_array: np.ndarray, face_location: Tuple, face_ratio: float
    ) -> Dict:
        """Assess the quality of the detected face"""
        top, right, bottom, left = face_location
        face_region = image_array[top:bottom, left:right]

        # Calculate sharpness using Laplacian variance
        gray_face = cv2.cvtColor(face_region, cv2.COLOR_RGB2GRAY)
        sharpness = cv2.Laplacian(gray_face, cv2.CV_64F).var()

        # Calculate brightness
        brightness = np.mean(face_region)

        # Size assessment
        face_width = right - left
        face_height = bottom - top
        min_face_size = self.quality_thresholds['min_face_size']

        size_quality = min(face_width / min_face_size, face_height / min_face_size, 1.0)

        # Overall quality score - adjusted for lower-quality cameras
        quality_score = min(
            (sharpness / 100) * 0.35  # Reduced sharpness weight
            + (brightness / 255) * 0.25  # Increased brightness weight
            + size_quality * 0.3  # Size weight
            + min(face_ratio * 10, 1.0) * 0.1,  # Face ratio weight
            1.0,
        )

        return {
            "score": round(quality_score, 3),
            "sharpness": round(sharpness, 2),
            "brightness": round(brightness, 2),
            "face_size": {"width": int(face_width), "height": int(face_height)},
            "is_good_quality": bool(quality_score > self.quality_thresholds['min_quality_score']),
        }

    def compare_faces(self, stored_encoding_data: str, captured_base64: str) -> Dict:
        """
        Compare stored face encoding with a newly captured face

        Args:
            stored_encoding_data: JSON string containing stored face encoding data
            captured_base64: Base64 encoded image of the captured face

        Returns:
            Dict with comparison results
        """
        try:
            # Parse stored encoding data
            stored_data = json.loads(stored_encoding_data)
            stored_encoding = np.array(stored_data["encoding"])

            # Encode the captured face
            captured_data = self.encode_face_from_base64(captured_base64)

            if not captured_data:
                return {
                    "success": False,
                    "confidence": 0.0,
                    "threshold": self.tolerance,
                    "error": "No face detected in captured image",
                }

            captured_encoding = np.array(captured_data["encoding"])

            # Calculate face distance
            face_distance = face_recognition.face_distance(
                [stored_encoding], captured_encoding
            )[0]

            # Convert distance to confidence (lower distance = higher confidence)
            confidence = 1 - face_distance

            # Determine if faces match
            is_match = face_distance <= self.tolerance

            return {
                "success": is_match,
                "confidence": round(confidence, 3),
                "face_distance": round(face_distance, 3),
                "threshold": self.tolerance,
                "captured_quality": captured_data["quality"],
                "stored_quality": stored_data.get("quality", {}),
                "match_details": {
                    "face_found": True,
                    "encoding_successful": True,
                    "comparison_successful": True,
                },
            }

        except json.JSONDecodeError as e:
            logger.error(f"Error parsing stored encoding data: {str(e)}")
            return {
                "success": False,
                "confidence": 0.0,
                "threshold": self.tolerance,
                "error": "Invalid stored face encoding data",
            }
        except Exception as e:
            logger.error(f"Error comparing faces: {str(e)}")
            return {
                "success": False,
                "confidence": 0.0,
                "threshold": self.tolerance,
                "error": f"Face comparison failed: {str(e)}",
            }

    def validate_image_quality(self, base64_image: str) -> Dict:
        """
        Validate if an image is suitable for face recognition

        Args:
            base64_image: Base64 encoded image string

        Returns:
            Dict with validation results
        """
        try:
            face_data = self.encode_face_from_base64(base64_image)

            if not face_data:
                return {
                    "is_valid": False,
                    "issues": ["No face detected in image"],
                    "recommendations": [
                        "Ensure face is clearly visible",
                        "Use good lighting",
                        "Face the camera directly",
                    ],
                }

            quality = face_data["quality"]
            issues = []
            recommendations = []

            # Use configurable thresholds from settings
            thresholds = self.quality_thresholds
            
            # Check quality metrics
            if quality["score"] < thresholds['min_quality_score']:
                issues.append(f"Low overall image quality (score: {quality['score']:.2f}, minimum: {thresholds['min_quality_score']})")
                recommendations.append("Use better lighting and ensure face is clear")

            if quality["sharpness"] < thresholds['min_sharpness']:
                issues.append(f"Image is too blurry (sharpness: {quality['sharpness']:.2f}, minimum: {thresholds['min_sharpness']})")
                recommendations.append("Keep camera steady and ensure good focus")

            if quality["brightness"] < thresholds['min_brightness'] or quality["brightness"] > thresholds['max_brightness']:
                issues.append(f"Poor lighting conditions (brightness: {quality['brightness']:.2f}, range: {thresholds['min_brightness']}-{thresholds['max_brightness']})")
                recommendations.append("Use good, even lighting on face")

            if (
                quality["face_size"]["width"] < thresholds['min_face_size']
                or quality["face_size"]["height"] < thresholds['min_face_size']
            ):
                issues.append(f"Face is too small (size: {quality['face_size']['width']}x{quality['face_size']['height']}, minimum: {thresholds['min_face_size']})")
                recommendations.append("Move closer to the camera")

            if face_data["face_ratio"] < thresholds['min_face_ratio']:
                issues.append(f"Face takes up too little of the image (ratio: {face_data['face_ratio']:.3f}, minimum: {thresholds['min_face_ratio']})")
                recommendations.append("Center your face and move closer to camera")
            
            # Log quality metrics for debugging
            logger.info(f"Image quality validation - Score: {quality['score']}, "
                       f"Sharpness: {quality['sharpness']}, Brightness: {quality['brightness']}, "
                       f"Face size: {quality['face_size']}, Face ratio: {face_data['face_ratio']}")

            return {
                "is_valid": len(issues) == 0,
                "quality_score": quality["score"],
                "issues": issues,
                "recommendations": recommendations,
                "face_data": face_data,
            }

        except Exception as e:
            logger.error(f"Error validating image quality: {str(e)}")
            return {
                "is_valid": False,
                "issues": [f"Image validation failed: {str(e)}"],
                "recommendations": ["Please try again with a clear image"],
            }


# Utility functions for views
def get_face_recognition_service():
    """Get face recognition service instance"""
    return FaceRecognitionService()


def process_employee_face_registration(employee, base64_image):
    """Process and store employee face data"""
    service = get_face_recognition_service()

    # Validate image quality first
    validation = service.validate_image_quality(base64_image)

    if not validation["is_valid"]:
        return {
            "success": False,
            "error": "Image quality validation failed",
            "issues": validation["issues"],
            "recommendations": validation["recommendations"],
        }

    # Encode face
    face_data = service.encode_face_from_base64(base64_image)

    if not face_data:
        return {"success": False, "error": "Could not process face from image"}

    # Store face encoding data
    face_encoding_json = json.dumps(
        {
            "encoding": face_data["encoding"],
            "quality": face_data["quality"],
            "registered_date": str(timezone.now()),
            "image_dimensions": face_data["image_dimensions"],
        }
    )

    employee.face_recognition_data = face_encoding_json
    employee.save()

    return {
        "success": True,
        "quality_score": face_data["quality"]["score"],
        "message": "Face registration successful",
    }


def verify_employee_face(employee, captured_base64):
    """Verify employee face against stored data"""
    if not employee.face_recognition_data:
        return {"success": False, "error": "No face data registered for this employee"}

    service = get_face_recognition_service()
    result = service.compare_faces(employee.face_recognition_data, captured_base64)

    return result
