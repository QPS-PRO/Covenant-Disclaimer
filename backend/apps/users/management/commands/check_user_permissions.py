# backend/apps/users/management/commands/check_user_permissions.py
# Create the directory structure if it doesn't exist:
# backend/apps/users/management/commands/

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.assets.models import Department, Employee

User = get_user_model()


class Command(BaseCommand):
    help = 'Check and display user permissions'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='User email to check')
        parser.add_argument('--set-manager', type=str, help='Set user as department manager (provide email)')
        parser.add_argument('--department', type=str, help='Department name (for --set-manager)')

    def handle(self, *args, **options):
        if options['set_manager'] and options['department']:
            self.set_department_manager(options['set_manager'], options['department'])
        elif options['email']:
            self.check_user(options['email'])
        else:
            self.list_all_users()

    def check_user(self, email):
        try:
            user = User.objects.get(email=email)
            self.stdout.write(self.style.SUCCESS(f'\n=== User: {user.email} ==='))
            self.stdout.write(f'Name: {user.first_name} {user.last_name}')
            self.stdout.write(f'Is Staff: {user.is_staff}')
            self.stdout.write(f'Is Superuser: {user.is_superuser}')
            
            try:
                employee = user.employee_profile
                self.stdout.write(f'\n--- Employee Profile ---')
                self.stdout.write(f'Employee ID: {employee.employee_id}')
                self.stdout.write(f'Department: {employee.department.name}')
                self.stdout.write(f'Is Active: {employee.is_active}')
                
                # Check if user is department manager
                is_manager = employee.department.manager == user
                self.stdout.write(f'Is Department Manager: {is_manager}')
                
                if is_manager:
                    self.stdout.write(self.style.SUCCESS(f'✓ Manager of: {employee.department.name}'))
                
            except Employee.DoesNotExist:
                self.stdout.write(self.style.WARNING('⚠ No employee profile found'))
            
            # Determine role
            self.stdout.write(f'\n--- Access Level ---')
            if user.is_superuser or user.is_staff:
                self.stdout.write(self.style.SUCCESS('✓ ADMIN - Full access'))
            elif hasattr(user, 'employee_profile'):
                try:
                    if user.employee_profile.department.manager == user:
                        self.stdout.write(self.style.SUCCESS('✓ DEPARTMENT MANAGER - Manager access'))
                    else:
                        self.stdout.write(self.style.SUCCESS('✓ EMPLOYEE - Basic access'))
                except:
                    self.stdout.write(self.style.SUCCESS('✓ EMPLOYEE - Basic access'))
            else:
                self.stdout.write(self.style.WARNING('⚠ NO ACCESS - No employee profile'))
                
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User not found: {email}'))

    def set_department_manager(self, email, department_name):
        try:
            user = User.objects.get(email=email)
            department = Department.objects.get(name__icontains=department_name)
            
            department.manager = user
            department.save()
            
            self.stdout.write(self.style.SUCCESS(
                f'✓ Set {user.email} as manager of {department.name}'
            ))
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User not found: {email}'))
        except Department.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Department not found: {department_name}'))

    def list_all_users(self):
        self.stdout.write(self.style.SUCCESS('\n=== All Users ===\n'))
        
        users = User.objects.all().order_by('email')
        for user in users:
            role = 'ADMIN' if (user.is_superuser or user.is_staff) else 'USER'
            try:
                employee = user.employee_profile
                dept = employee.department.name
                is_manager = employee.department.manager == user
                if is_manager:
                    role = 'MANAGER'
                elif role == 'USER':
                    role = 'EMPLOYEE'
                self.stdout.write(f'{user.email:30} | {role:10} | Dept: {dept}')
            except Employee.DoesNotExist:
                self.stdout.write(f'{user.email:30} | {role:10} | No employee profile')