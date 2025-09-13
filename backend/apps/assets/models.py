from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator

User = get_user_model()

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    manager = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='managed_departments'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']

class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    employee_id = models.CharField(
        max_length=20, 
        unique=True,
        validators=[RegexValidator(r'^[A-Z0-9]{3,20}$', 'Employee ID must be 3-20 alphanumeric characters')]
    )
    phone_number = models.CharField(
        max_length=15,
        validators=[RegexValidator(r'^\+?1?\d{9,15}$', 'Phone number must be valid')]
    )
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='employees')
    face_recognition_data = models.TextField(blank=True, null=True)  # Store face encoding data
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.employee_id})"

    @property
    def name(self):
        return self.user.get_full_name()

    @property
    def email(self):
        return self.user.email

    class Meta:
        ordering = ['user__first_name', 'user__last_name']

class Asset(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('assigned', 'Assigned'),
        ('maintenance', 'Under Maintenance'),
        ('retired', 'Retired'),
    ]

    name = models.CharField(max_length=200)
    serial_number = models.CharField(max_length=100, unique=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='assets')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    description = models.TextField(blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    purchase_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    current_holder = models.ForeignKey(
        Employee, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='current_assets'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.serial_number})"

    class Meta:
        ordering = ['name', 'serial_number']

class AssetTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('issue', 'Issue'),
        ('return', 'Return'),
    ]

    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='transactions')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='asset_transactions')
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    transaction_date = models.DateTimeField(auto_now_add=True)
    processed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='processed_transactions'
    )
    notes = models.TextField(blank=True)
    face_verification_success = models.BooleanField(default=False)
    
    # Return specific fields
    return_condition = models.CharField(max_length=100, blank=True)
    damage_notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.transaction_type.title()} - {self.asset.name} - {self.employee.name}"

    class Meta:
        ordering = ['-transaction_date']