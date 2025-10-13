from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()

# Create your models here.
class ReportPermission(models.Model):
    """
    NEW MODEL: Admin configuration for employee report access
    """
    employee = models.OneToOneField(
        "assets.Employee",
        on_delete=models.CASCADE,
        related_name="report_permission",
        verbose_name="Employee"
    )
    can_access_reports = models.BooleanField(
        default=False,
        help_text="Can this employee access and download reports?"
    )
    granted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="granted_report_permissions",
        help_text="Admin who granted this permission"
    )
    granted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(
        blank=True,
        help_text="Optional notes about why this permission was granted"
    )

    class Meta:
        verbose_name = "Report Permission"
        verbose_name_plural = "Report Permissions"

    def __str__(self):
        status = "Granted" if self.can_access_reports else "Revoked"
        return f"{self.employee.name} - Reports Access: {status}"