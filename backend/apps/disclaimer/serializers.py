from rest_framework import serializers
from django.utils import timezone
from .models import (
    DisclaimerDepartmentConfig,
    DepartmentDisclaimerOrder,
    DisclaimerRequest,
    DisclaimerProcess,
)
from apps.assets.serializers import DepartmentSerializer


class DisclaimerDepartmentConfigSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = DisclaimerDepartmentConfig
        fields = [
            "id",
            "department",
            "department_name",
            "requires_disclaimer",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class DepartmentDisclaimerOrderSerializer(serializers.ModelSerializer):
    employee_department_name = serializers.CharField(
        source="employee_department.name", read_only=True
    )
    target_department_name = serializers.CharField(
        source="target_department.name", read_only=True
    )
    target_department_data = DepartmentSerializer(
        source="target_department", read_only=True
    )

    class Meta:
        model = DepartmentDisclaimerOrder
        fields = [
            "id",
            "employee_department",
            "employee_department_name",
            "target_department",
            "target_department_name",
            "target_department_data",
            "order",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, data):
        """Validate that target department requires disclaimer"""
        target_dept = data.get("target_department")
        if target_dept:
            try:
                config = DisclaimerDepartmentConfig.objects.get(department=target_dept)
                if not config.requires_disclaimer or not config.is_active:
                    raise serializers.ValidationError(
                        f"{target_dept.name} does not require disclaimer clearance. "
                        "Please enable it in Admin settings first."
                    )
            except DisclaimerDepartmentConfig.DoesNotExist:
                raise serializers.ValidationError(
                    f"{target_dept.name} is not configured for disclaimers."
                )

        return data


class DepartmentDisclaimerOrderBulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk updating department order"""

    orders = serializers.ListField(
        child=serializers.DictField(child=serializers.IntegerField())
    )

    def validate_orders(self, value):
        """Validate orders list"""
        if not value:
            raise serializers.ValidationError("Orders list cannot be empty")

        # Check for duplicate IDs
        ids = [item["id"] for item in value if "id" in item]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("Duplicate order IDs found")

        # Check for duplicate order numbers
        orders = [item["order"] for item in value if "order" in item]
        if len(orders) != len(set(orders)):
            raise serializers.ValidationError("Duplicate order numbers found")

        return value


class DisclaimerRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_id_number = serializers.CharField(source="employee.employee_id", read_only=True)
    employee_department = serializers.CharField(source="employee.department.name", read_only=True)
    target_department_name = serializers.CharField(
        source="target_department.name", read_only=True
    )
    reviewed_by_name = serializers.SerializerMethodField()
    process_info = serializers.SerializerMethodField()
    unreturned_assets_count = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = DisclaimerRequest
        fields = [
            "id",
            "employee",
            "employee_name",
            "employee_id_number",
            "employee_department",
            "process",
            "process_info",
            "target_department",
            "target_department_name",
            "step_number",
            "status",
            "status_display",
            "employee_notes",
            "manager_notes",
            "rejection_reason",
            "reviewed_by",
            "reviewed_by_name",
            "reviewed_at",
            "created_at",
            "updated_at",
            "unreturned_assets_count",
        ]
        read_only_fields = ["reviewed_by", "reviewed_at", "created_at", "updated_at"]

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name() or obj.reviewed_by.email
        return None

    def get_process_info(self, obj):
        """Get basic process information"""
        if obj.process:
            return {
                "id": obj.process.id,
                "process_number": obj.process.process_number,
                "status": obj.process.status,
                "total_steps": obj.process.total_steps,
            }
        return None

    def get_unreturned_assets_count(self, obj):
        """Get count of unreturned assets from the target department"""
        from apps.assets.models import Asset
        
        return Asset.objects.filter(
            current_holder=obj.employee,
            department=obj.target_department
        ).count()


class DisclaimerProcessHistorySerializer(serializers.ModelSerializer):
    """Serializer for process history view"""

    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_department = serializers.CharField(
        source="employee.department.name", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    progress_percentage = serializers.IntegerField(read_only=True)
    duration_days = serializers.SerializerMethodField()
    completed_steps = serializers.SerializerMethodField()

    class Meta:
        model = DisclaimerProcess
        fields = [
            "id",
            "process_number",
            "employee_name",
            "employee_department",
            "status",
            "status_display",
            "current_step",
            "total_steps",
            "progress_percentage",
            "started_at",
            "completed_at",
            "duration_days",
            "completed_steps",
        ]
        read_only_fields = ["started_at", "completed_at"]

    def get_duration_days(self, obj):
        """Calculate how long the process took"""
        if obj.completed_at and obj.started_at:
            delta = obj.completed_at - obj.started_at
            return delta.days
        return None

    def get_completed_steps(self, obj):
        """Get summary of completed steps"""
        approved_requests = obj.requests.filter(status="approved").order_by(
            "step_number"
        )
        return [
            {
                "step_number": req.step_number,
                "department": req.target_department.name,
                "approved_at": req.reviewed_at,
            }
            for req in approved_requests
        ]


class DisclaimerRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisclaimerRequest
        fields = ["target_department", "employee_notes"]

    def validate(self, data):
        """Validate request can be created"""
        employee = self.context["employee"]
        process = self.context["process"]
        target_dept = data.get("target_department")

        # Check if this is the correct next department
        order_config = DepartmentDisclaimerOrder.objects.filter(
            employee_department=employee.department,
            target_department=target_dept,
            order=process.current_step,
            is_active=True,
        ).first()

        if not order_config:
            raise serializers.ValidationError(
                f"You cannot request disclaimer from {target_dept.name} at this step."
            )

        # Check if there's already a pending request for this step in this process
        existing_request = DisclaimerRequest.objects.filter(
            process=process, step_number=process.current_step, status="pending"
        ).first()

        if existing_request:
            raise serializers.ValidationError(
                f"You already have a pending request for step {process.current_step}. "
                "Please wait for response before submitting again."
            )

        data["step_number"] = process.current_step
        return data


class DisclaimerRequestReviewSerializer(serializers.Serializer):
    """Serializer for reviewing disclaimer requests"""

    status = serializers.ChoiceField(choices=["approved", "rejected"])
    manager_notes = serializers.CharField(required=False, allow_blank=True)
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data["status"] == "rejected" and not data.get("rejection_reason"):
            raise serializers.ValidationError(
                "Rejection reason is required when rejecting a request."
            )
        return data


class DisclaimerProcessSerializer(serializers.ModelSerializer):
    """Serializer for DisclaimerProcess with additional computed fields"""

    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_id_number = serializers.CharField(
        source="employee.employee_id", read_only=True
    )
    employee_department = serializers.CharField(
        source="employee.department.name", read_only=True
    )
    progress_percentage = serializers.IntegerField(read_only=True)
    duration_days = serializers.SerializerMethodField()

    class Meta:
        model = DisclaimerProcess
        fields = [
            "id",
            "employee",
            "employee_name",
            "employee_id_number",
            "employee_department",
            "status",
            "current_step",
            "total_steps",
            "progress_percentage",
            "started_at",
            "completed_at",
            "is_active",
            "process_number",
            "duration_days",
        ]
        read_only_fields = ["started_at", "completed_at", "process_number"]

    def get_duration_days(self, obj):
        """Calculate duration in days"""
        if obj.status == "completed" and obj.completed_at:
            duration = obj.completed_at - obj.started_at
            return duration.days
        elif obj.status == "in_progress":
            from django.utils import timezone

            duration = timezone.now() - obj.started_at
            return duration.days
        return None


class DisclaimerFlowStepSerializer(serializers.Serializer):
    """Serializer for disclaimer flow steps (for employee view)"""

    step_number = serializers.IntegerField()
    department_id = serializers.IntegerField()
    department_name = serializers.CharField()
    status = serializers.CharField()  # 'pending', 'approved', 'rejected', 'locked'
    is_active = serializers.BooleanField()
    is_completed = serializers.BooleanField()
    can_request = serializers.BooleanField()
    request = DisclaimerRequestSerializer(allow_null=True)


class EmployeeDisclaimerStatusSerializer(serializers.Serializer):
    """Complete status for employee disclaimer"""

    has_active_process = serializers.BooleanField()
    process = DisclaimerProcessSerializer(allow_null=True)
    flow_steps = DisclaimerFlowStepSerializer(many=True)
    can_start_process = serializers.BooleanField()
