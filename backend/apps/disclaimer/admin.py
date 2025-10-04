from django.contrib import admin
from .models import (
    DisclaimerDepartmentConfig,
    DepartmentDisclaimerOrder,
    DisclaimerRequest,
    DisclaimerProcess,
)


@admin.register(DisclaimerDepartmentConfig)
class DisclaimerDepartmentConfigAdmin(admin.ModelAdmin):
    list_display = ["department", "requires_disclaimer", "is_active", "created_at"]
    list_filter = ["requires_disclaimer", "is_active"]
    search_fields = ["department__name"]
    ordering = ["department__name"]


@admin.register(DepartmentDisclaimerOrder)
class DepartmentDisclaimerOrderAdmin(admin.ModelAdmin):
    list_display = ["employee_department", "target_department", "order", "is_active"]
    list_filter = ["employee_department", "is_active"]
    search_fields = ["employee_department__name", "target_department__name"]
    ordering = ["employee_department", "order"]


@admin.register(DisclaimerRequest)
class DisclaimerRequestAdmin(admin.ModelAdmin):
    list_display = [
        "employee",
        "target_department",
        "step_number",
        "status",
        "reviewed_by",
        "created_at",
    ]
    list_filter = ["status", "target_department", "created_at"]
    search_fields = [
        "employee__user__first_name",
        "employee__user__last_name",
        "employee__employee_id",
        "target_department__name",
    ]
    readonly_fields = ["created_at", "updated_at", "reviewed_at"]
    ordering = ["-created_at"]

    fieldsets = (
        (
            "Request Information",
            {
                "fields": (
                    "employee",
                    "target_department",
                    "step_number",
                    "status",
                    "employee_notes",
                )
            },
        ),
        (
            "Review Information",
            {
                "fields": (
                    "reviewed_by",
                    "reviewed_at",
                    "manager_notes",
                    "rejection_reason",
                )
            },
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(DisclaimerProcess)
class DisclaimerProcessAdmin(admin.ModelAdmin):
    list_display = [
        "employee",
        "status",
        "current_step",
        "total_steps",
        "progress_percentage",
        "started_at",
    ]
    list_filter = ["status", "is_active"]
    search_fields = [
        "employee__user__first_name",
        "employee__user__last_name",
        "employee__employee_id",
    ]
    readonly_fields = ["started_at", "completed_at", "progress_percentage"]
    ordering = ["-started_at"]

    fieldsets = (
        ("Employee Information", {"fields": ("employee",)}),
        (
            "Process Status",
            {
                "fields": (
                    "status",
                    "current_step",
                    "total_steps",
                    "progress_percentage",
                    "is_active",
                )
            },
        ),
        ("Timestamps", {"fields": ("started_at", "completed_at")}),
    )

    def progress_percentage(self, obj):
        return f"{obj.progress_percentage}%"

    progress_percentage.short_description = "Progress"
