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
    employee_id_number = serializers.CharField(
        source="employee.employee_id", read_only=True
    )
    employee_department = serializers.CharField(
        source="employee.department.name", read_only=True
    )
    target_department_name = serializers.CharField(
        source="target_department.name", read_only=True
    )
    reviewed_by_name = serializers.CharField(
        source="reviewed_by.get_full_name", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = DisclaimerRequest
        fields = [
            "id",
            "employee",
            "employee_name",
            "employee_id_number",
            "employee_department",
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
        ]
        read_only_fields = [
            "employee",
            "step_number",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]


class DisclaimerRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisclaimerRequest
        fields = ["target_department", "employee_notes"]

    def validate(self, data):
        """Validate request can be created"""
        employee = self.context["employee"]
        target_dept = data.get("target_department")

        # Get active process
        process = DisclaimerProcess.objects.filter(
            employee=employee, is_active=True, status="in_progress"
        ).first()

        if not process:
            raise serializers.ValidationError(
                "No active disclaimer process found. Please start a new process."
            )

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

        # Check if there's already a pending request for this step
        existing_request = DisclaimerRequest.objects.filter(
            employee=employee, step_number=process.current_step, status="pending"
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
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_id_number = serializers.CharField(
        source="employee.employee_id", read_only=True
    )
    employee_department = serializers.CharField(
        source="employee.department.name", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    progress_percentage = serializers.IntegerField(read_only=True)
    current_request = serializers.SerializerMethodField()
    all_requests = serializers.SerializerMethodField()

    class Meta:
        model = DisclaimerProcess
        fields = [
            "id",
            "employee",
            "employee_name",
            "employee_id_number",
            "employee_department",
            "status",
            "status_display",
            "current_step",
            "total_steps",
            "progress_percentage",
            "started_at",
            "completed_at",
            "is_active",
            "current_request",
            "all_requests",
        ]
        read_only_fields = ["started_at", "completed_at", "is_active"]

    def get_current_request(self, obj):
        """Get the current step's request"""
        request = (
            obj.employee.disclaimer_requests.filter(step_number=obj.current_step)
            .order_by("-created_at")
            .first()
        )

        if request:
            return DisclaimerRequestSerializer(request).data
        return None

    def get_all_requests(self, obj):
        """Get all requests for this process"""
        requests = obj.employee.disclaimer_requests.filter(
            step_number__lte=obj.current_step
        ).order_by("step_number", "-created_at")

        # Get unique requests per step (latest only)
        unique_requests = {}
        for req in requests:
            if req.step_number not in unique_requests:
                unique_requests[req.step_number] = req

        return DisclaimerRequestSerializer(unique_requests.values(), many=True).data


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
