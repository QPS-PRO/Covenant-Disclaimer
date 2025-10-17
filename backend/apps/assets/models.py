from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
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
        validators=[RegexValidator(r'^[A-Z0-9]{1,20}$', 'Employee ID must be 1-20 alphanumeric characters')]
    )
    phone_number = models.CharField(
        max_length=15,
        validators=[RegexValidator(r'^\+?1?\d{9,15}$', 'Phone number must be valid')]
    )
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='employees')
    face_recognition_data = models.TextField(blank=True, null=True)
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
        ('available', _("Available")),
        ('assigned', _("Assigned")),
        ('maintenance', _("Maintenance")),
        ('retired', _("Retired")),
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

    def clean(self):
        """Custom validation for asset status"""
        super().clean()
        if self.status == 'assigned' and not self.current_holder:
            raise ValidationError('Asset marked as assigned must have a current holder.')
        elif self.status != 'assigned' and self.current_holder:
            raise ValidationError('Asset not marked as assigned cannot have a current holder.')

    def delete(self, *args, **kwargs):
        """Prevent deletion if asset is currently assigned to an employee"""
        if self.status == 'assigned' and self.current_holder:
            raise ValidationError(
                f'Cannot delete asset "{self.name}" - it is currently assigned to {self.current_holder.name}. '
                f'Please return the asset first before deleting.'
            )
        super().delete(*args, **kwargs)

    def can_be_deleted(self):
        """Check if asset can be deleted"""
        return not (self.status == 'assigned' and self.current_holder)

    @property
    def is_assigned(self):
        """Check if asset is currently assigned"""
        return self.status == 'assigned' and self.current_holder is not None

    class Meta:
        ordering = ['name', 'serial_number']

class AssetTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('issue', _('Issue')),
        ('return', _('Return')),
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
    
    # Face verification fields
    face_verification_success = models.BooleanField(default=False)
    face_verification_confidence = models.FloatField(default=0.0, help_text="Confidence score from face verification (0.0 to 1.0)")
    
    # Return specific fields
    return_condition = models.CharField(max_length=100, blank=True, null=True)
    damage_notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.transaction_type.title()} - {self.asset.name} - {self.employee.name}"

    class Meta:
        ordering = ['-transaction_date']
        
    @property
    def verification_status(self):
        """Return human-readable verification status"""
        if self.face_verification_success:
            return f"Verified ({self.face_verification_confidence:.1%})"
        return "Not Verified"