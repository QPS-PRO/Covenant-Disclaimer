from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from dj_rest_auth.registration.serializers import RegisterSerializer
from dj_rest_auth.serializers import LoginSerializer
from django.utils.translation import gettext_lazy as _

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
            
            # Get report permission
            report_permission = None
            try:
                if hasattr(employee, 'report_permission'):
                    perm = employee.report_permission
                    report_permission = {
                        'id': perm.id,
                        'can_access_reports': perm.can_access_reports,
                        'granted_at': perm.granted_at.isoformat() if perm.granted_at else None,
                        'notes': perm.notes
                    }
            except Exception as e:
                print(f"Error getting report permission: {e}")
                report_permission = None
            
            return {
                "id": employee.id,
                "employee_id": employee.employee_id,
                "name": employee.name,
                "department_id": employee.department.id,
                "department_name": employee.department.name,
                "is_active": getattr(employee, "is_active", True),
                "has_face_data": getattr(employee, "has_face_data", False),
                "is_department_manager": employee.department.manager == obj,
                "report_permission": report_permission,
            }
        except Exception as e:
            print(f"Error getting employee profile: {e}")
            return None


class CustomLoginSerializer(LoginSerializer):
    """
    Custom login serializer that checks if user account is active.
    """
    
    def validate(self, attrs):
        username = attrs.get('username')
        email = attrs.get('email')
        password = attrs.get('password')
        
        user = None
        
        # Authenticate with email
        if email and password:
            user = authenticate(username=email, password=password)
        
        # Check if user exists and is active
        if user:
            if not user.is_active:
                msg = _('User account is disabled.')
                raise serializers.ValidationError(msg)
        else:
            msg = _('Unable to log in with provided credentials.')
            raise serializers.ValidationError(msg)
        
        attrs['user'] = user
        return attrs


class CustomRegisterSerializer(RegisterSerializer):
    """
    Custom registration serializer to include first name, last name, and employee fields.
    Creates both User and Employee profile on registration.
    """

    username = None
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    employee_id = serializers.CharField(required=True)
    phone_number = serializers.CharField(required=True)
    department = serializers.IntegerField(required=True)

    def validate_email(self, value):
        """Validate that email is unique"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists")
        return value
    
    def validate_employee_id(self, value):
        """Validate that employee_id is unique"""
        from apps.assets.models import Employee
        if Employee.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError("Employee ID already exists")
        return value
    
    def validate_phone_number(self, value):
        """Validate phone number format"""
        import re
        # Remove any spaces, dashes, or parentheses
        cleaned = re.sub(r'[\s\-\(\)]', '', value)
        # Check if it matches a valid phone number pattern (9-15 digits, optional + at start)
        if not re.match(r'^\+?[0-9]{9,15}$', cleaned):
            raise serializers.ValidationError("Phone number must be between 9-15 digits")
        return value

    def validate_department(self, value):
        """Validate that department exists"""
        from apps.assets.models import Department
        try:
            Department.objects.get(id=value)
        except Department.DoesNotExist:
            raise serializers.ValidationError("Department not found")
        return value

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data.update(
            {
                "first_name": self.validated_data.get("first_name", ""),
                "last_name": self.validated_data.get("last_name", ""),
                "employee_id": self.validated_data.get("employee_id", ""),
                "phone_number": self.validated_data.get("phone_number", ""),
                "department": self.validated_data.get("department"),
            }
        )
        return data

    def save(self, request):
        from apps.assets.models import Employee, Department
        
        user = super().save(request)
        user.first_name = self.cleaned_data.get("first_name")
        user.last_name = self.cleaned_data.get("last_name")
        user.save()
        
        # Create Employee profile
        department = Department.objects.get(id=self.cleaned_data.get("department"))
        Employee.objects.create(
            user=user,
            employee_id=self.cleaned_data.get("employee_id"),
            phone_number=self.cleaned_data.get("phone_number"),
            department=department
        )
        
        return user