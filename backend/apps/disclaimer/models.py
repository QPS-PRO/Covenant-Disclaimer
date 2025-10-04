from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db.models import Max

User = get_user_model()


class DisclaimerDepartmentConfig(models.Model):
    """
    Admin configuration: which departments require disclaimer clearance
    """

    department = models.OneToOneField(
        "assets.Department",
        on_delete=models.CASCADE,
        related_name="disclaimer_config",
        verbose_name="Department",
    )
    requires_disclaimer = models.BooleanField(
        default=False, help_text="Does this department require disclaimer clearance?"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Disclaimer Department Configuration"
        verbose_name_plural = "Disclaimer Department Configurations"
        ordering = ["department__name"]

    def __str__(self):
        return f"{self.department.name} - {'Required' if self.requires_disclaimer else 'Not Required'}"


class DepartmentDisclaimerOrder(models.Model):
    """
    Department manager configuration: order of departments for disclaimer flow
    Each employee's department has its own order configuration
    """

    employee_department = models.ForeignKey(
        "assets.Department",
        on_delete=models.CASCADE,
        related_name="disclaimer_orders",
        help_text="The department whose employees follow this order",
    )
    target_department = models.ForeignKey(
        "assets.Department",
        on_delete=models.CASCADE,
        related_name="disclaimer_targets",
        help_text="Department that needs to approve",
    )
    order = models.PositiveIntegerField(
        help_text="Order in the disclaimer flow (1, 2, 3, ...)"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Department Disclaimer Order"
        verbose_name_plural = "Department Disclaimer Orders"
        ordering = ["employee_department", "order"]
        unique_together = [
            ["employee_department", "target_department"],
            ["employee_department", "order"],
        ]

    def __str__(self):
        return f"{self.employee_department.name} → Step {self.order}: {self.target_department.name}"

    def clean(self):
        super().clean()
        # Validate that target department requires disclaimer
        if (
            not hasattr(self.target_department, "disclaimer_config")
            or not self.target_department.disclaimer_config.requires_disclaimer
        ):
            raise ValidationError(
                f"{self.target_department.name} does not require disclaimer clearance. "
                "Please enable it in Admin settings first."
            )


class DisclaimerRequest(models.Model):
    """
    Individual disclaimer request from an employee
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    employee = models.ForeignKey(
        "assets.Employee", on_delete=models.CASCADE, related_name="disclaimer_requests"
    )
    target_department = models.ForeignKey(
        "assets.Department",
        on_delete=models.CASCADE,
        related_name="received_disclaimer_requests",
        help_text="Department that needs to approve",
    )
    step_number = models.PositiveIntegerField(help_text="Step in the disclaimer flow")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    employee_notes = models.TextField(
        blank=True, help_text="Notes from employee with the request"
    )
    manager_notes = models.TextField(
        blank=True, help_text="Response notes from department manager"
    )
    rejection_reason = models.TextField(
        blank=True, help_text="Reason for rejection (required if rejected)"
    )
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_disclaimers",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Disclaimer Request"
        verbose_name_plural = "Disclaimer Requests"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["employee", "status"]),
            models.Index(fields=["target_department", "status"]),
        ]

    def __str__(self):
        return f"{self.employee.name} → {self.target_department.name} (Step {self.step_number}) - {self.status}"

    def clean(self):
        super().clean()
        if self.status == "rejected" and not self.rejection_reason:
            raise ValidationError(
                "Rejection reason is required when rejecting a request."
            )

    @property
    def is_pending(self):
        return self.status == "pending"

    @property
    def is_approved(self):
        return self.status == "approved"

    @property
    def is_rejected(self):
        return self.status == "rejected"


class DisclaimerProcess(models.Model):
    """
    Overall disclaimer process tracking for an employee
    """

    STATUS_CHOICES = [
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("blocked", "Blocked"),
    ]

    employee = models.ForeignKey(
        "assets.Employee", on_delete=models.CASCADE, related_name="disclaimer_processes"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="in_progress"
    )
    current_step = models.PositiveIntegerField(
        default=1, help_text="Current step in the disclaimer flow"
    )
    total_steps = models.PositiveIntegerField(
        help_text="Total number of steps in the flow"
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Disclaimer Process"
        verbose_name_plural = "Disclaimer Processes"
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.employee.name} - Step {self.current_step}/{self.total_steps} - {self.status}"

    @property
    def progress_percentage(self):
        """Calculate completion percentage"""
        if self.total_steps == 0:
            return 0
        return int((self.current_step - 1) / self.total_steps * 100)

    @property
    def is_completed(self):
        return self.status == "completed"

    def can_proceed_to_next_step(self):
        """Check if employee can proceed to next step"""
        if self.status == "completed":
            return False

        # Check if current step is approved
        current_request = self.employee.disclaimer_requests.filter(
            step_number=self.current_step, status="approved"
        ).first()

        return current_request is not None

    def get_next_department(self):
        """Get the next department in the flow"""
        if self.current_step >= self.total_steps:
            return None

        next_step = self.current_step + 1
        order_config = DepartmentDisclaimerOrder.objects.filter(
            employee_department=self.employee.department,
            order=next_step,
            is_active=True,
        ).first()

        return order_config.target_department if order_config else None
