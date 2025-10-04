from django.utils.deprecation import MiddlewareMixin


class UserContextMiddleware(MiddlewareMixin):
    """
    Middleware to add user context information to request
    """

    def process_request(self, request):
        if request.user.is_authenticated:
            # Check if user is admin
            request.user.is_admin = request.user.is_superuser or request.user.is_staff

            # Check if user is department manager
            try:
                employee = request.user.employee_profile
                request.user.is_department_manager = (
                    employee.department.manager == request.user
                )
                request.user.employee_department = employee.department
            except:
                request.user.is_department_manager = False
                request.user.employee_department = None

        return None
