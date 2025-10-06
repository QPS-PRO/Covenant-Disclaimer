from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import (
    DisclaimerDepartmentConfig,
    DepartmentDisclaimerOrder,
    DisclaimerRequest,
    DisclaimerProcess,
)
from .serializers import (
    DisclaimerDepartmentConfigSerializer,
    DepartmentDisclaimerOrderSerializer,
    DepartmentDisclaimerOrderBulkUpdateSerializer,
    DisclaimerRequestSerializer,
    DisclaimerRequestCreateSerializer,
    DisclaimerRequestReviewSerializer,
    DisclaimerProcessSerializer,
    DisclaimerFlowStepSerializer,
    EmployeeDisclaimerStatusSerializer,
)
from .permissions import IsAdmin, IsDepartmentManager, IsEmployee
from apps.assets.models import Department, Employee
from django.db.models import Max

# ============ ADMIN VIEWS ============


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def disclaimer_department_config_view(request):
    """
    GET: List all department disclaimer configurations
    POST: Create or update department disclaimer configuration
    """
    if request.method == "GET":
        configs = DisclaimerDepartmentConfig.objects.select_related("department").all()
        serializer = DisclaimerDepartmentConfigSerializer(configs, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = DisclaimerDepartmentConfigSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated, IsAdmin])
def disclaimer_department_config_detail_view(request, pk):
    """
    GET: Retrieve a specific department disclaimer configuration
    PUT/PATCH: Update a department disclaimer configuration
    DELETE: Delete a department disclaimer configuration
    """
    config = get_object_or_404(DisclaimerDepartmentConfig, pk=pk)

    if request.method == "GET":
        serializer = DisclaimerDepartmentConfigSerializer(config)
        return Response(serializer.data)

    elif request.method in ["PUT", "PATCH"]:
        partial = request.method == "PATCH"
        serializer = DisclaimerDepartmentConfigSerializer(
            config, data=request.data, partial=partial
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        config.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_department_disclaimer_orders_view(request, department_id):
    """
    GET: Get disclaimer order configuration for a specific department (Admin only)
    """
    try:
        department = get_object_or_404(Department, pk=department_id)

        orders = (
            DepartmentDisclaimerOrder.objects.filter(
                employee_department=department, is_active=True
            )
            .select_related("target_department")
            .order_by("order")
        )

        serializer = DepartmentDisclaimerOrderSerializer(orders, many=True)

        # Get available departments for adding
        configured_dept_ids = orders.values_list("target_department_id", flat=True)

        # Get all departments that require disclaimer
        available_departments = (
            DisclaimerDepartmentConfig.objects.filter(
                requires_disclaimer=True, is_active=True
            )
            .exclude(department_id__in=configured_dept_ids)
            .select_related("department")
        )

        available_depts = [
            {"id": config.department.id, "name": config.department.name}
            for config in available_departments
        ]

        return Response(
            {
                "orders": serializer.data,
                "available_departments": available_depts,
                "department": {"id": department.id, "name": department.name},
            }
        )

    except Department.DoesNotExist:
        return Response(
            {"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_department_disclaimer_order_create_view(request, department_id):
    """
    POST: Add a new department to the disclaimer order (Admin only)
    """
    try:
        department = get_object_or_404(Department, pk=department_id)

        # Get the next order number
        max_order = (
            DepartmentDisclaimerOrder.objects.filter(
                employee_department=department, is_active=True
            ).aggregate(max_order=Max("order"))["max_order"]
            or 0
        )

        data = request.data.copy()
        data["employee_department"] = department.id
        data["order"] = max_order + 1

        serializer = DepartmentDisclaimerOrderSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Department.DoesNotExist:
        return Response(
            {"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["PUT"])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_department_disclaimer_orders_reorder_view(request, department_id):
    """
    PUT: Reorder departments in the disclaimer flow (Admin only)
    Expected data: { "orders": [{"id": 1, "order": 1}, {"id": 2, "order": 2}, ...] }
    """
    try:
        department = get_object_or_404(Department, pk=department_id)

        serializer = DepartmentDisclaimerOrderBulkUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        orders_data = serializer.validated_data["orders"]

        with transaction.atomic():
            for order_data in orders_data:
                order_obj = DepartmentDisclaimerOrder.objects.get(
                    id=order_data["id"], employee_department=department
                )
                order_obj.order = order_data["order"]
                order_obj.save()

        # Return updated orders
        updated_orders = (
            DepartmentDisclaimerOrder.objects.filter(
                employee_department=department, is_active=True
            )
            .select_related("target_department")
            .order_by("order")
        )

        result_serializer = DepartmentDisclaimerOrderSerializer(
            updated_orders, many=True
        )
        return Response(result_serializer.data)

    except Department.DoesNotExist:
        return Response(
            {"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except DepartmentDisclaimerOrder.DoesNotExist:
        return Response(
            {"error": "Order configuration not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_department_disclaimer_order_delete_view(request, department_id, order_id):
    """
    DELETE: Remove a department from the disclaimer order (Admin only)
    """
    try:
        department = get_object_or_404(Department, pk=department_id)

        order = get_object_or_404(
            DepartmentDisclaimerOrder, pk=order_id, employee_department=department
        )

        deleted_order = order.order
        order.delete()

        # Reorder remaining orders
        with transaction.atomic():
            remaining_orders = DepartmentDisclaimerOrder.objects.filter(
                employee_department=department, order__gt=deleted_order, is_active=True
            ).order_by("order")

            for idx, order_obj in enumerate(remaining_orders, start=deleted_order):
                order_obj.order = idx
                order_obj.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    except Department.DoesNotExist:
        return Response(
            {"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_all_departments_disclaimer_summary_view(request):
    """
    GET: Get a summary of disclaimer configurations for all departments
    """
    try:
        departments = Department.objects.all()
        summary = []

        for dept in departments:
            # Get disclaimer config
            config = DisclaimerDepartmentConfig.objects.filter(department=dept).first()

            # Count orders
            orders_count = DepartmentDisclaimerOrder.objects.filter(
                employee_department=dept, is_active=True
            ).count()

            summary.append(
                {
                    "id": dept.id,
                    "name": dept.name,
                    "requires_disclaimer": config.requires_disclaimer
                    if config
                    else False,
                    "config_active": config.is_active if config else False,
                    "disclaimer_steps_count": orders_count,
                    "has_configuration": orders_count > 0,
                }
            )

        return Response(summary)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============ DEPARTMENT MANAGER VIEWS ============


#
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsDepartmentManager])
def department_disclaimer_orders_view(request):
    """
    GET: Get disclaimer order configuration for manager's department
    """
    try:
        employee = request.user.employee_profile
        department = employee.department

        orders = (
            DepartmentDisclaimerOrder.objects.filter(
                employee_department=department, is_active=True
            )
            .select_related("target_department")
            .order_by("order")
        )

        serializer = DepartmentDisclaimerOrderSerializer(orders, many=True)

        # Get available departments for adding
        configured_dept_ids = orders.values_list("target_department_id", flat=True)

        # Get all departments that require disclaimer (including own department)
        available_departments = (
            DisclaimerDepartmentConfig.objects.filter(
                requires_disclaimer=True, is_active=True
            )
            .exclude(department_id__in=configured_dept_ids)
            # REMOVED: .exclude(department=department)  # Now managers CAN add their own department
            .select_related("department")
        )

        available_depts = [
            {"id": config.department.id, "name": config.department.name}
            for config in available_departments
        ]

        return Response(
            {
                "orders": serializer.data,
                "available_departments": available_depts,
                "department": {"id": department.id, "name": department.name},
            }
        )

    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsDepartmentManager])
def department_disclaimer_order_create_view(request):
    """
    POST: Add a new department to the disclaimer order
    """
    try:
        employee = request.user.employee_profile
        department = employee.department

        # Get the next order number
        max_order = (
            DepartmentDisclaimerOrder.objects.filter(
                employee_department=department, is_active=True
            ).aggregate(max_order=Max("order"))["max_order"]
            or 0
        )

        data = request.data.copy()
        data["employee_department"] = department.id
        data["order"] = max_order + 1

        serializer = DepartmentDisclaimerOrderSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["PUT"])
@permission_classes([IsAuthenticated, IsDepartmentManager])
def department_disclaimer_orders_reorder_view(request):
    """
    PUT: Reorder departments in the disclaimer flow
    Expected data: { "orders": [{"id": 1, "order": 1}, {"id": 2, "order": 2}, ...] }
    """
    try:
        employee = request.user.employee_profile
        department = employee.department

        serializer = DepartmentDisclaimerOrderBulkUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        orders_data = serializer.validated_data["orders"]

        with transaction.atomic():
            for order_data in orders_data:
                order_obj = DepartmentDisclaimerOrder.objects.get(
                    id=order_data["id"], employee_department=department
                )
                order_obj.order = order_data["order"]
                order_obj.save()

        # Return updated orders
        updated_orders = (
            DepartmentDisclaimerOrder.objects.filter(
                employee_department=department, is_active=True
            )
            .select_related("target_department")
            .order_by("order")
        )

        result_serializer = DepartmentDisclaimerOrderSerializer(
            updated_orders, many=True
        )
        return Response(result_serializer.data)

    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except DepartmentDisclaimerOrder.DoesNotExist:
        return Response(
            {"error": "Order configuration not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated, IsDepartmentManager])
def department_disclaimer_order_delete_view(request, pk):
    """
    DELETE: Remove a department from the disclaimer order
    """
    try:
        employee = request.user.employee_profile
        department = employee.department

        order = get_object_or_404(
            DepartmentDisclaimerOrder, pk=pk, employee_department=department
        )

        deleted_order = order.order
        order.delete()

        # Reorder remaining orders
        with transaction.atomic():
            remaining_orders = DepartmentDisclaimerOrder.objects.filter(
                employee_department=department, order__gt=deleted_order, is_active=True
            ).order_by("order")

            for idx, order_obj in enumerate(remaining_orders, start=deleted_order):
                order_obj.order = idx
                order_obj.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsDepartmentManager])
def manager_pending_requests_view(request):
    """
    GET: Get all pending disclaimer requests for manager's department
    """
    try:
        employee = request.user.employee_profile
        department = employee.department

        requests = (
            DisclaimerRequest.objects.filter(
                target_department=department, status="pending"
            )
            .select_related("employee__user", "employee__department")
            .order_by("-created_at")
        )

        serializer = DisclaimerRequestSerializer(requests, many=True)
        return Response(serializer.data)

    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsDepartmentManager])
def manager_review_request_view(request, request_id):
    """
    POST: Review (approve/reject) a disclaimer request
    """
    try:
        employee = request.user.employee_profile
        department = employee.department

        disclaimer_request = get_object_or_404(
            DisclaimerRequest,
            pk=request_id,
            target_department=department,
            status="pending",
        )

        serializer = DisclaimerRequestReviewSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Update request
            disclaimer_request.status = serializer.validated_data["status"]
            disclaimer_request.manager_notes = serializer.validated_data.get(
                "manager_notes", ""
            )
            disclaimer_request.rejection_reason = serializer.validated_data.get(
                "rejection_reason", ""
            )
            disclaimer_request.reviewed_by = request.user
            disclaimer_request.reviewed_at = timezone.now()
            disclaimer_request.save()

            # Update process if approved
            if disclaimer_request.status == "approved":
                process = DisclaimerProcess.objects.filter(
                    employee=disclaimer_request.employee,
                    is_active=True,
                    status="in_progress",
                ).first()

                if process:
                    # Move to next step
                    if process.current_step < process.total_steps:
                        process.current_step += 1
                        process.save()
                    else:
                        # Complete the process
                        process.status = "completed"
                        process.completed_at = timezone.now()
                        process.save()

        result_serializer = DisclaimerRequestSerializer(disclaimer_request)
        return Response(result_serializer.data)

    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND
        )


# ============ EMPLOYEE VIEWS ============


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsEmployee])
def employee_disclaimer_status_view(request):
    """
    GET: Get employee's complete disclaimer status and flow
    """
    try:
        employee = request.user.employee_profile

        # Check if ever completed
        has_ever_completed = DisclaimerProcess.has_completed_process(employee)

        # Get or check for active process
        process = DisclaimerProcess.objects.filter(
            employee=employee, is_active=True
        ).first()

        # Get the disclaimer flow for this employee's department
        flow_orders = (
            DepartmentDisclaimerOrder.objects.filter(
                employee_department=employee.department, is_active=True
            )
            .select_related("target_department")
            .order_by("order")
        )

        # Build flow steps
        flow_steps = []
        for order in flow_orders:
            # Get the latest request for this step
            step_request = None
            if process:
                step_request = (
                    DisclaimerRequest.objects.filter(
                        employee=employee, step_number=order.order
                    )
                    .order_by("-created_at")
                    .first()
                )

            # Determine step status
            if not process:
                step_status = "locked"
                is_active = False
                can_request = False
            elif process.current_step == order.order:
                if step_request:
                    step_status = step_request.status
                    is_active = True
                    can_request = step_request.status == "rejected"
                else:
                    step_status = "pending"
                    is_active = True
                    can_request = True
            elif order.order < process.current_step:
                step_status = "approved" if step_request else "skipped"
                is_active = False
                can_request = False
            else:
                step_status = "locked"
                is_active = False
                can_request = False

            flow_steps.append(
                {
                    "step_number": order.order,
                    "department_id": order.target_department.id,
                    "department_name": order.target_department.name,
                    "status": step_status,
                    "is_active": is_active,
                    "is_completed": step_status == "approved",
                    "can_request": can_request,
                    "request": DisclaimerRequestSerializer(step_request).data
                    if step_request
                    else None,
                }
            )

        # NEW: Can only start if never completed before
        can_start_process = (
            not has_ever_completed
            and (not process or process.status != "in_progress")
            and len(flow_orders) > 0
        )

        response_data = {
            "has_active_process": process is not None
            and process.status == "in_progress",
            "has_ever_completed": has_ever_completed,
            "process": DisclaimerProcessSerializer(process).data if process else None,
            "flow_steps": flow_steps,
            "can_start_process": can_start_process,
        }

        return Response(response_data)

    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsEmployee])
def employee_start_disclaimer_process_view(request):
    """
    POST: Start a new disclaimer process for employee
    NOTE: Cannot restart if already completed once
    """
    try:
        employee = request.user.employee_profile

        # NEW: Check if employee has ever completed the disclaimer process
        if DisclaimerProcess.has_completed_process(employee):
            return Response(
                {
                    "error": "You have already completed the disclaimer process. "
                    "The disclaimer can only be completed once and cannot be restarted."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if there's already an active in-progress process
        existing_process = DisclaimerProcess.objects.filter(
            employee=employee, is_active=True, status="in_progress"
        ).first()

        if existing_process:
            return Response(
                {"error": "You already have an active disclaimer process"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get total steps
        total_steps = DepartmentDisclaimerOrder.objects.filter(
            employee_department=employee.department, is_active=True
        ).count()

        if total_steps == 0:
            return Response(
                {"error": "No disclaimer flow configured for your department"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create new process
        process = DisclaimerProcess.objects.create(
            employee=employee,
            status="in_progress",
            current_step=1,
            total_steps=total_steps,
        )

        serializer = DisclaimerProcessSerializer(process)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsEmployee])
def employee_submit_disclaimer_request_view(request):
    """
    POST: Submit a disclaimer request for the current step
    """
    try:
        employee = request.user.employee_profile

        serializer = DisclaimerRequestCreateSerializer(
            data=request.data, context={"employee": employee}
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Create the request
        disclaimer_request = DisclaimerRequest.objects.create(
            employee=employee,
            target_department=serializer.validated_data["target_department"],
            step_number=serializer.validated_data["step_number"],
            employee_notes=serializer.validated_data.get("employee_notes", ""),
            status="pending",
        )

        result_serializer = DisclaimerRequestSerializer(disclaimer_request)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)

    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsEmployee])
def employee_disclaimer_history_view(request):
    """
    GET: Get employee's disclaimer request history
    """
    try:
        employee = request.user.employee_profile

        requests = (
            DisclaimerRequest.objects.filter(employee=employee)
            .select_related("target_department", "reviewed_by")
            .order_by("-created_at")
        )

        serializer = DisclaimerRequestSerializer(requests, many=True)
        return Response(serializer.data)

    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND
        )


# ============ GENERAL VIEWS ============


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def disclaimer_statistics_view(request):
    """
    GET: Get disclaimer statistics (for admins and managers)
    """
    try:
        employee = request.user.employee_profile
        is_manager = employee.department.manager == request.user

        if is_manager:
            # Manager stats for their department
            pending_count = DisclaimerRequest.objects.filter(
                target_department=employee.department, status="pending"
            ).count()

            approved_count = DisclaimerRequest.objects.filter(
                target_department=employee.department, status="approved"
            ).count()

            rejected_count = DisclaimerRequest.objects.filter(
                target_department=employee.department, status="rejected"
            ).count()

            return Response(
                {
                    "department": employee.department.name,
                    "pending_requests": pending_count,
                    "approved_requests": approved_count,
                    "rejected_requests": rejected_count,
                    "total_requests": pending_count + approved_count + rejected_count,
                }
            )
        else:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsDepartmentManager])
def manager_all_requests_view(request):
    """
    GET: Get all disclaimer requests for manager's department (not just pending)
    """
    try:
        employee = request.user.employee_profile
        department = employee.department

        # Get ALL requests for this department, not just pending
        requests = (
            DisclaimerRequest.objects.filter(target_department=department)
            .select_related("employee__user", "employee__department", "reviewed_by")
            .order_by("-created_at")
        )

        serializer = DisclaimerRequestSerializer(requests, many=True)
        return Response(serializer.data)

    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND
        )
