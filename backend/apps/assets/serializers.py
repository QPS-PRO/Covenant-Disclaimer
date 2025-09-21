from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from .models import Department, Employee, Asset, AssetTransaction
from .face_recognition_service import verify_employee_face

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
    can_be_deleted = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = (
            'id', 'name', 'serial_number', 'department', 'department_name',
            'status', 'description', 'purchase_date', 'purchase_cost',
            'current_holder', 'current_holder_name', 'current_holder_employee_id',
            'can_be_deleted', 'created_at', 'updated_at'
        )
        read_only_fields = ('created_at', 'updated_at', 'can_be_deleted')

    def get_can_be_deleted(self, obj):
        """Check if asset can be deleted"""
        return obj.can_be_deleted()

    def validate(self, data):
        """Custom validation for asset data"""
        status = data.get('status')
        current_holder = data.get('current_holder')
        
        # If we're updating an existing instance, get current values
        if self.instance:
            status = status if status is not None else self.instance.status
            current_holder = current_holder if current_holder is not None else self.instance.current_holder

        # Validate status and current_holder relationship
        if status == 'assigned' and not current_holder:
            raise serializers.ValidationError('Asset marked as assigned must have a current holder.')
        elif status != 'assigned' and current_holder:
            # If status is not assigned but holder is provided, clear the holder
            data['current_holder'] = None

        return data

class AssetTransactionCreateSerializer(serializers.ModelSerializer):
    face_verification_data = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = AssetTransaction
        fields = [
            'asset', 'employee', 'transaction_type', 'notes',
            'return_condition', 'damage_notes', 'face_verification_data'
        ]

    def validate(self, attrs):
        """
        Validate the transaction data and perform face verification if required
        """
        employee = attrs.get('employee')
        asset = attrs.get('asset')
        transaction_type = attrs.get('transaction_type')
        face_verification_data = attrs.get('face_verification_data')

        print(f"Validating transaction - Employee: {employee.name if employee else None}, Asset: {asset.name if asset else None}")
        print(f"Face verification data present: {bool(face_verification_data)}")

        # Basic validation
        if transaction_type == 'issue' and asset.status != 'available':
            raise serializers.ValidationError(f"Asset '{asset.name}' is not available for issue (current status: {asset.status})")
        
        if transaction_type == 'return':
            if asset.status != 'assigned':
                raise serializers.ValidationError(f"Asset '{asset.name}' is not currently assigned (current status: {asset.status})")
            if asset.current_holder != employee:
                current_holder_name = asset.current_holder.name if asset.current_holder else "None"
                raise serializers.ValidationError(f"Asset '{asset.name}' is not assigned to {employee.name} (currently assigned to: {current_holder_name})")

        # Face verification validation
        if employee and employee.face_recognition_data:
            print(f"Employee {employee.name} has face data, checking verification...")
            
            if not face_verification_data:
                raise serializers.ValidationError(
                    f"Face verification is required for employee '{employee.name}' who has registered face data"
                )
            
            # Perform face verification
            try:
                verification_result = verify_employee_face(employee, face_verification_data)
                print(f"Verification result: {verification_result}")
                
                if not verification_result['success']:
                    error_msg = f"Face verification failed for employee '{employee.name}': {verification_result.get('error', 'Unknown error')}"
                    if verification_result.get('confidence'):
                        confidence_pct = verification_result['confidence'] * 100
                        threshold_pct = verification_result.get('threshold', 0.6) * 100
                        error_msg += f" (Confidence: {confidence_pct:.1f}%, Required: {threshold_pct:.0f}%)"
                    raise serializers.ValidationError(error_msg)
                
                # Store verification result
                attrs['face_verification_success'] = True
                attrs['face_verification_confidence'] = verification_result.get('confidence', 0.0)
                print(f"Face verification successful with confidence: {verification_result.get('confidence', 0.0):.1%}")
                
            except Exception as e:
                print(f"Face verification error: {str(e)}")
                raise serializers.ValidationError(f"Face verification failed due to technical error: {str(e)}")
                
        else:
            # No face data available, mark as not verified but allow transaction
            attrs['face_verification_success'] = False
            attrs['face_verification_confidence'] = 0.0
            print(f"Employee {employee.name if employee else 'Unknown'} has no face data, marking as not verified")

        return attrs

    def create(self, validated_data):
        # Remove face_verification_data from validated_data before creating
        validated_data.pop('face_verification_data', None)
        
        # Get the current user as processed_by
        request = self.context.get('request')
        if request and request.user:
            validated_data['processed_by'] = request.user

        transaction = super().create(validated_data)
        
        # Update asset status based on transaction type
        asset = transaction.asset
        employee = transaction.employee
        
        if transaction.transaction_type == 'issue':
            asset.status = 'assigned'
            asset.current_holder = employee
        elif transaction.transaction_type == 'return':
            asset.status = 'available'
            asset.current_holder = None
            
        asset.save()
        
        return transaction

class AssetTransactionSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    asset_serial_number = serializers.CharField(source='asset.serial_number', read_only=True)
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)
    verification_status = serializers.SerializerMethodField()
    
    class Meta:
        model = AssetTransaction
        fields = [
            'id', 'asset', 'asset_name', 'asset_serial_number',
            'employee', 'employee_name', 'employee_id',
            'transaction_type', 'transaction_date', 'notes',
            'processed_by', 'processed_by_name',
            'face_verification_success', 'face_verification_confidence',
            'return_condition', 'damage_notes', 'verification_status'
        ]
        read_only_fields = ['id', 'transaction_date']

    def get_verification_status(self, obj):
        """Return human-readable verification status"""
        if obj.face_verification_success:
            return f"Verified ({obj.face_verification_confidence:.1%})"
        return "Not Verified"


class DashboardStatsSerializer(serializers.Serializer):
    total_employees = serializers.IntegerField()
    total_assets = serializers.IntegerField()
    total_departments = serializers.IntegerField()
    assets_assigned = serializers.IntegerField()
    assets_available = serializers.IntegerField()
    recent_transactions = serializers.IntegerField()
    weekly_data = serializers.ListField()
    department_distribution = serializers.ListField()

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

class FaceRegistrationSerializer(serializers.Serializer):
    """Serializer for face registration"""
    employee_id = serializers.IntegerField()
    face_image_data = serializers.CharField()
    
    def validate(self, data):
        try:
            employee = Employee.objects.get(id=data['employee_id'], is_active=True)
            data['employee'] = employee
        except Employee.DoesNotExist:
            raise serializers.ValidationError("Employee not found or inactive")
        
        return data

class FaceImageValidationSerializer(serializers.Serializer):
    """Serializer for face image validation"""
    face_image_data = serializers.CharField()
    
class EmployeeProfileSerializer(serializers.ModelSerializer):
    """Comprehensive serializer for employee profile page"""
    name = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    user_data = UserBasicSerializer(source='user', read_only=True)
    has_face_data = serializers.SerializerMethodField()
    member_since = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = (
            'id', 'employee_id', 'name', 'email', 'phone_number',
            'department', 'department_name', 'user_data', 'is_active',
            'has_face_data', 'member_since', 'created_at', 'updated_at'
        )

    def get_has_face_data(self, obj):
        return bool(obj.face_recognition_data)

    def get_member_since(self, obj):
        return obj.created_at.strftime('%B %d, %Y') if obj.created_at else None

class AssetReturnSerializer(serializers.Serializer):
    """Serializer for asset return endpoint"""
    asset_id = serializers.IntegerField()
    employee_id = serializers.IntegerField()
    return_condition = serializers.ChoiceField(choices=[
        ('Excellent', 'Excellent'),
        ('Good', 'Good'),
        ('Fair', 'Fair'),
        ('Poor', 'Poor'),
        ('Damaged', 'Damaged'),
        ('Broken', 'Broken'),
    ])
    damage_notes = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    face_verification_data = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        # Validate asset exists and is assigned
        try:
            asset = Asset.objects.get(id=data['asset_id'])
            if asset.status != 'assigned':
                raise serializers.ValidationError(f"Asset is not currently assigned (status: {asset.status})")
            data['asset'] = asset
        except Asset.DoesNotExist:
            raise serializers.ValidationError("Asset not found")

        # Validate employee exists and is active
        try:
            employee = Employee.objects.get(id=data['employee_id'], is_active=True)
            data['employee'] = employee
        except Employee.DoesNotExist:
            raise serializers.ValidationError("Employee not found or inactive")

        # Validate asset is assigned to this employee
        if asset.current_holder != employee:
            current_holder = asset.current_holder.name if asset.current_holder else "None"
            raise serializers.ValidationError(
                f"Asset is not assigned to this employee (currently assigned to: {current_holder})"
            )

        # Validate damage notes are provided for damaged/broken items
        if data['return_condition'] in ['Damaged', 'Broken', 'Poor'] and not data.get('damage_notes'):
            raise serializers.ValidationError(
                f"Damage description is required for items in '{data['return_condition']}' condition"
            )

        return data

class EmployeeStatsSerializer(serializers.Serializer):
    """Serializer for employee statistics"""
    employee_id = serializers.IntegerField()
    employee_name = serializers.CharField()
    has_face_data = serializers.BooleanField()
    current_assets_count = serializers.IntegerField()
    is_active = serializers.BooleanField()
    total_transactions = serializers.IntegerField()
    transactions_by_type = serializers.DictField()
    total_issues = serializers.IntegerField()
    total_returns = serializers.IntegerField()
    face_verified_transactions = serializers.IntegerField()
    face_verification_rate = serializers.FloatField()
    recent_activity = serializers.DictField()
    monthly_trends = serializers.ListField()
    return_conditions = serializers.ListField()
    average_monthly_transactions = serializers.FloatField()
    return_rate = serializers.FloatField()
