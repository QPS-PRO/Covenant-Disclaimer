from rest_framework import serializers
from apps.reports.models import ReportPermission


class ReportPermissionSerializer(serializers.ModelSerializer):
    """Serializer for report permissions"""
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_id_number = serializers.CharField(
        source="employee.employee_id", read_only=True
    )
    employee_department = serializers.CharField(
        source="employee.department.name", read_only=True
    )
    granted_by_name = serializers.CharField(
        source="granted_by.get_full_name", read_only=True
    )
    
    class Meta:
        model = ReportPermission
        fields = [
            "id",
            "employee",
            "employee_name",
            "employee_id_number",
            "employee_department",
            "can_access_reports",
            "granted_by",
            "granted_by_name",
            "granted_at",
            "updated_at",
            "notes",
        ]
        read_only_fields = ["granted_by", "granted_at", "updated_at"]

    def validate_employee(self, value):
        """Ensure employee exists and is valid"""
        if not value.is_active:
            raise serializers.ValidationError("Cannot grant permission to inactive employee")
        return value