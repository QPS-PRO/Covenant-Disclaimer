from rest_framework import serializers
from django.contrib.auth import get_user_model
from dj_rest_auth.registration.serializers import RegisterSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model with permission flags.
    """

    is_department_manager = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    department_id = serializers.SerializerMethodField()
    employee_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "is_staff",
            "is_superuser",
            "is_department_manager",
            "department",
            "department_id",
            "employee_profile",
        )
        read_only_fields = ("email", "is_staff", "is_superuser")

    def get_is_department_manager(self, obj):
        """Check if user is a department manager"""
        try:
            employee = obj.employee_profile
            return employee.department.manager == obj
        except:
            return False

    def get_department(self, obj):
        """Get user's department name"""
        try:
            employee = obj.employee_profile
            return employee.department.name
        except:
            return None

    def get_department_id(self, obj):
        """Get user's department ID"""
        try:
            employee = obj.employee_profile
            return employee.department.id
        except:
            return None

    def get_employee_profile(self, obj):
        """Get complete employee profile data"""
        try:
            employee = obj.employee_profile
            return {
                "id": employee.id,
                "employee_id": employee.employee_id,
                "name": employee.name,
                "department_id": employee.department.id,
                "department_name": employee.department.name,
                "is_active": employee.is_active,
                "has_face_data": employee.has_face_data,
                "is_department_manager": employee.department.manager == obj,
            }
        except Exception as e:
            return None


class CustomRegisterSerializer(RegisterSerializer):
    """
    Custom registration serializer to include first name and last name fields.
    """

    username = None
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data.update(
            {
                "first_name": self.validated_data.get("first_name", ""),
                "last_name": self.validated_data.get("last_name", ""),
            }
        )
        return data

    def save(self, request):
        user = super().save(request)
        user.first_name = self.cleaned_data.get("first_name")
        user.last_name = self.cleaned_data.get("last_name")
        user.save()
        return user
