from django.contrib import admin
from .models import Department, Employee, Asset, AssetTransaction

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'manager', 'employee_count', 'asset_count', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'manager__first_name', 'manager__last_name')
    
    def employee_count(self, obj):
        return obj.employees.filter(is_active=True).count()
    employee_count.short_description = 'Active Employees'
    
    def asset_count(self, obj):
        return obj.assets.count()
    asset_count.short_description = 'Assets'

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('name', 'employee_id', 'department', 'phone_number', 'is_active', 'created_at')
    list_filter = ('department', 'is_active', 'created_at')
    search_fields = ('user__first_name', 'user__last_name', 'employee_id', 'user__email')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('name', 'serial_number', 'department', 'status', 'current_holder', 'created_at')
    list_filter = ('status', 'department', 'created_at')
    search_fields = ('name', 'serial_number', 'description')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(AssetTransaction)
class AssetTransactionAdmin(admin.ModelAdmin):
    list_display = ('asset', 'employee', 'transaction_type', 'transaction_date', 'processed_by')
    list_filter = ('transaction_type', 'transaction_date', 'asset__department')
    search_fields = ('asset__name', 'employee__user__first_name', 'employee__user__last_name')
    readonly_fields = ('transaction_date',)