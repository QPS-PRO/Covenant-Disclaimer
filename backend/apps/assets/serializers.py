from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Department, Employee, Asset, AssetTransaction

User = get_user_model()

class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'email')

class DepartmentSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    employee_count = serializers.SerializerMethodField()
    asset_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ('id', 'name', 'manager', 'manager_name', 'employee_count', 'asset_count', 'created_at', 'updated_at')

    def get_employee_count(self, obj):
        return obj.employees.filter(is_active=True).count()

    def get_asset_count(self, obj):
        return obj.assets.count()

class EmployeeSerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    user_data = UserBasicSerializer(source='user', read_only=True)
    current_assets_count = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = (
            'id', 'employee_id', 'name', 'email', 'phone_number', 
            'department', 'department_name', 'user_data', 'is_active',
            'current_assets_count', 'created_at', 'updated_at'
        )
        read_only_fields = ('created_at', 'updated_at')

    def get_current_assets_count(self, obj):
        return obj.current_assets.count()

class EmployeeCreateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    
    class Meta:
        model = Employee
        fields = (
            'employee_id', 'phone_number', 'department', 
            'first_name', 'last_name', 'email'
        )

    def create(self, validated_data):
        user_data = {
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'email': validated_data.pop('email'),
        }
        
        # Create user
        user = User.objects.create_user(**user_data)
        
        # Create employee
        employee = Employee.objects.create(user=user, **validated_data)
        return employee

class AssetSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    current_holder_name = serializers.CharField(source='current_holder.name', read_only=True)
    current_holder_employee_id = serializers.CharField(source='current_holder.employee_id', read_only=True)

    class Meta:
        model = Asset
        fields = (
            'id', 'name', 'serial_number', 'department', 'department_name',
            'status', 'description', 'purchase_date', 'purchase_cost',
            'current_holder', 'current_holder_name', 'current_holder_employee_id',
            'created_at', 'updated_at'
        )
        read_only_fields = ('current_holder', 'created_at', 'updated_at')

class AssetTransactionSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    asset_serial = serializers.CharField(source='asset.serial_number', read_only=True)
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)

    class Meta:
        model = AssetTransaction
        fields = (
            'id', 'asset', 'asset_name', 'asset_serial',
            'employee', 'employee_name', 'employee_id',
            'transaction_type', 'transaction_date', 'processed_by', 'processed_by_name',
            'notes', 'face_verification_success', 'return_condition', 'damage_notes'
        )
        read_only_fields = ('transaction_date', 'processed_by')

class AssetTransactionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetTransaction
        fields = (
            'asset', 'employee', 'transaction_type', 'notes',
            'face_verification_success', 'return_condition', 'damage_notes'
        )

    def create(self, validated_data):
        validated_data['processed_by'] = self.context['request'].user
        transaction = super().create(validated_data)
        
        # Update asset status and current holder
        asset = transaction.asset
        if transaction.transaction_type == 'issue':
            asset.status = 'assigned'
            asset.current_holder = transaction.employee
        elif transaction.transaction_type == 'return':
            asset.status = 'available'
            asset.current_holder = None
        
        asset.save()
        return transaction

class DashboardStatsSerializer(serializers.Serializer):
    total_employees = serializers.IntegerField()
    total_assets = serializers.IntegerField()
    total_departments = serializers.IntegerField()
    assets_assigned = serializers.IntegerField()
    assets_available = serializers.IntegerField()
    recent_transactions = serializers.IntegerField()
    weekly_issues = serializers.ListField()
    weekly_returns = serializers.ListField()
    department_distribution = serializers.ListField()