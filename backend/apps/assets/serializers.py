# backend/apps/assets/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Department, Employee, Asset, AssetTransaction
import json

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
    has_face_data = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = (
            'id', 'employee_id', 'name', 'email', 'phone_number', 
            'department', 'department_name', 'user_data', 'is_active',
            'current_assets_count', 'has_face_data', 'face_recognition_data',
            'created_at', 'updated_at'
        )
        read_only_fields = ('created_at', 'updated_at')
        extra_kwargs = {
            'face_recognition_data': {'write_only': True}
        }

    def get_current_assets_count(self, obj):
        return obj.current_assets.count()
    
    def get_has_face_data(self, obj):
        return bool(obj.face_recognition_data)

class EmployeeCreateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    face_recognition_data = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Employee
        fields = (
            'employee_id', 'phone_number', 'department', 
            'first_name', 'last_name', 'email', 'face_recognition_data'
        )

    def create(self, validated_data):
        user_data = {
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'email': validated_data.pop('email'),
        }
        
        # Extract face recognition data
        face_data = validated_data.pop('face_recognition_data', None)
        
        # Create user
        user = User.objects.create_user(**user_data)
        
        # Create employee
        employee = Employee.objects.create(user=user, **validated_data)
        
        # Save face recognition data if provided
        if face_data:
            employee.face_recognition_data = face_data
            employee.save()
            
        return employee

class EmployeeUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)
    face_recognition_data = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Employee
        fields = (
            'employee_id', 'phone_number', 'department',
            'first_name', 'last_name', 'email', 'face_recognition_data'
        )

    def update(self, instance, validated_data):
        # Handle user data updates
        user_data = {}
        if 'first_name' in validated_data:
            user_data['first_name'] = validated_data.pop('first_name')
        if 'last_name' in validated_data:
            user_data['last_name'] = validated_data.pop('last_name')
        if 'email' in validated_data:
            user_data['email'] = validated_data.pop('email')
            
        if user_data:
            for attr, value in user_data.items():
                setattr(instance.user, attr, value)
            instance.user.save()

        # Handle face recognition data
        if 'face_recognition_data' in validated_data:
            face_data = validated_data.pop('face_recognition_data')
            instance.face_recognition_data = face_data

        # Update employee fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        instance.save()
        return instance

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
    face_verification_data = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = AssetTransaction
        fields = (
            'asset', 'employee', 'transaction_type', 'notes',
            'face_verification_success', 'return_condition', 'damage_notes',
            'face_verification_data'
        )

    def validate(self, data):
        """
        Validate transaction data and perform face verification if needed
        """
        employee = data.get('employee')
        face_verification_data = data.get('face_verification_data')
        
        # If employee has face recognition data and face verification data is provided
        if employee and employee.face_recognition_data and face_verification_data:
            # In a real implementation, you would call a face recognition service here
            # For now, we'll simulate the verification
            verification_result = self.simulate_face_verification(
                employee.face_recognition_data, 
                face_verification_data
            )
            data['face_verification_success'] = verification_result
        else:
            # If no face data available, verification fails
            data['face_verification_success'] = False
            
        return data
    
    def simulate_face_verification(self, stored_face_data, captured_face_data):
        """
        Simulate face verification process
        In production, this would integrate with a real face recognition service
        """
        try:
            # Simulate face comparison logic
            # In reality, you would:
            # 1. Extract face encodings from both images
            # 2. Calculate similarity/distance
            # 3. Compare against threshold
            
            # For demo purposes, let's simulate based on data similarity
            import hashlib
            stored_hash = hashlib.md5(stored_face_data.encode()).hexdigest()
            captured_hash = hashlib.md5(captured_face_data.encode()).hexdigest()
            
            # Simulate 80% success rate for demo
            import random
            return random.random() > 0.2
            
        except Exception:
            return False

    def create(self, validated_data):
        # Remove face verification data before saving
        validated_data.pop('face_verification_data', None)
        
        # Set processed_by to current user
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

class FaceVerificationSerializer(serializers.Serializer):
    """Serializer for face verification endpoint"""
    employee_id = serializers.IntegerField()
    face_data = serializers.CharField()
    
    def validate(self, data):
        try:
            employee = Employee.objects.get(id=data['employee_id'])
            if not employee.face_recognition_data:
                raise serializers.ValidationError("Employee has no registered face data")
            data['employee'] = employee
        except Employee.DoesNotExist:
            raise serializers.ValidationError("Employee not found")
        
        return data

class DashboardStatsSerializer(serializers.Serializer):
    total_employees = serializers.IntegerField()
    total_assets = serializers.IntegerField()
    total_departments = serializers.IntegerField()
    assets_assigned = serializers.IntegerField()
    assets_available = serializers.IntegerField()
    recent_transactions = serializers.IntegerField()
    weekly_data = serializers.ListField()
    department_distribution = serializers.ListField()