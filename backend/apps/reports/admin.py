from django.contrib import admin
from django.utils.text import Truncator
from .models import ReportPermission


@admin.register(ReportPermission)
class ReportPermissionAdmin(admin.ModelAdmin):
    # show everything you want right in the list (no need to open a detail page)
    list_display = (
        "employee",
        "can_access_reports",
        "granted_by",
        "granted_at",
        "updated_at",
        "notes_short",
    )

    # remove the link to the detail page
    list_display_links = None

    # make the whole model read-only in admin
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    # small helper to keep notes short in the table
    def notes_short(self, obj):
        return Truncator(obj.notes).chars(80)
    notes_short.short_description = "Notes"

    # optional: small perf boost for related fields
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("employee__user", "employee__department", "granted_by")
