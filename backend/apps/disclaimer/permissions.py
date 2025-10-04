from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Permission for admin users (superusers or staff)
    """

    def has_permission(self, request, view):
        return request.user and (request.user.is_superuser or request.user.is_staff)


class IsDepartmentManager(permissions.BasePermission):
    """
    Permission for department managers
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        try:
            employee = request.user.employee_profile
            # Check if user is a manager of their department
            return employee.department.manager == request.user
        except:
            return False


class IsEmployee(permissions.BasePermission):
    """
    Permission for employees (all authenticated users with employee profile)
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        try:
            # Just check if they have an employee profile
            employee = request.user.employee_profile
            return employee.is_active
        except:
            return False


class IsAdminOrManager(permissions.BasePermission):
    """
    Permission for admins or department managers
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if admin
        if request.user.is_superuser or request.user.is_staff:
            return True

        # Check if department manager
        try:
            employee = request.user.employee_profile
            return employee.department.manager == request.user
        except:
            return False


class IsAdminOrOwner(permissions.BasePermission):
    """
    Permission for admins or the owner of the resource
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Admin can access everything
        if request.user.is_superuser or request.user.is_staff:
            return True

        # Check if owner
        try:
            if hasattr(obj, "employee"):
                return obj.employee.user == request.user
            elif hasattr(obj, "user"):
                return obj.user == request.user
            return False
        except:
            return False
