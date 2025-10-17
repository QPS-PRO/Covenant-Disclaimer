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
    FIXED: Get employee disclaimer status WITH flow_steps
    """
    try:
        employee = request.user.employee_profile

        # Check if there's an active in-progress process
        has_active = DisclaimerProcess.has_active_process(employee)

        # Get current active process if exists
        current_process = None
        if has_active:
            current_process = DisclaimerProcess.objects.filter(
                employee=employee, status="in_progress", is_active=True
            ).first()

        # Check if department requires disclaimer
        requires_disclaimer = (
            hasattr(employee.department, "disclaimer_config")
            and employee.department.disclaimer_config.requires_disclaimer
        )

        # Get disclaimer flow orders
        orders = (
            DepartmentDisclaimerOrder.objects.filter(
                employee_department=employee.department, is_active=True
            )
            .select_related("target_department")
            .order_by("order")
        )

        # Build flow steps array - THIS IS CRITICAL
        flow_steps = []
        for order in orders:
            step_data = {
                "step_number": order.order,
                "department_id": order.target_department.id,
                "department_name": order.target_department.name,
                "is_active": False,
                "is_completed": False,
                "can_request": False,
                "status": "locked",
                "request_id": None,
                "request": None,
            }

            # If there's an active process, check the status of this step
            if current_process:
                # Check if this is the current active step
                step_data["is_active"] = order.order == current_process.current_step

                # Get any existing request for this step
                step_request = (
                    DisclaimerRequest.objects.filter(
                        process=current_process, step_number=order.order
                    )
                    .select_related("target_department", "reviewed_by")
                    .first()
                )

                if step_request:
                    step_data["request_id"] = step_request.id
                    step_data["status"] = step_request.status
                    step_data["is_completed"] = step_request.status == "approved"

                    # Serialize the request details
                    step_data["request"] = {
                        "id": step_request.id,
                        "status": step_request.status,
                        "employee_notes": step_request.employee_notes,
                        "manager_notes": step_request.manager_notes,
                        "rejection_reason": step_request.rejection_reason,
                        "reviewed_by_name": (step_request.reviewed_by.get_full_name() or step_request.reviewed_by.email)
                        if step_request.reviewed_by
                        else None,
                        "reviewed_at": step_request.reviewed_at.isoformat()
                        if step_request.reviewed_at
                        else None,
                        "created_at": step_request.created_at.isoformat()
                        if step_request.created_at
                        else None,
                    }

                    # If rejected, status should show as 'rejected' not 'blocked'
                    if step_request.status == "rejected":
                        step_data["status"] = "rejected"

                # Check if this step can accept a new request
                if order.order == current_process.current_step:
                    # Can request if no existing request OR if the existing request was rejected
                    if not step_request:
                        step_data["can_request"] = True
                        step_data["status"] = "available"
                    elif step_request.status == "rejected":
                        # Allow resubmission after rejection
                        step_data["can_request"] = True
                    elif step_request.status == "pending":
                        step_data["status"] = "pending"
                        step_data["can_request"] = False
                elif order.order < current_process.current_step:
                    # Previous steps - should be completed
                    if step_request and step_request.status == "approved":
                        step_data["is_completed"] = True
            else:
                # No active process - only first step can be requested after starting
                if order.order == 1:
                    step_data["status"] = "available"

            flow_steps.append(step_data)

        # Build main response
        response_data = {
            "has_active_process": has_active,
            "can_start_new_process": not has_active
            and requires_disclaimer
            and orders.exists(),
            "requires_disclaimer": requires_disclaimer,
            "can_start_process": not has_active
            and requires_disclaimer
            and orders.exists(),  # Alias for frontend
            "total_processes": DisclaimerProcess.objects.filter(
                employee=employee
            ).count(),
            "completed_processes": DisclaimerProcess.objects.filter(
                employee=employee, status="completed"
            ).count(),
            "flow_steps": flow_steps,  # CRITICAL: Always include this, even if empty
        }

        # Add current process details if exists
        if current_process:
            response_data["process"] = {
                "id": current_process.id,
                "status": current_process.status,
                "current_step": current_process.current_step,
                "total_steps": current_process.total_steps,
                "progress_percentage": current_process.progress_percentage,
                "started_at": current_process.started_at.isoformat(),
                "completed_at": current_process.completed_at.isoformat()
                if current_process.completed_at
                else None,
                "process_number": current_process.process_number,
            }

            # Also include as 'current_process' for compatibility
            response_data["current_process"] = response_data["process"]

            # Get current step request details
            current_step_request = (
                DisclaimerRequest.objects.filter(
                    process=current_process, step_number=current_process.current_step
                )
                .select_related("target_department", "reviewed_by")
                .first()
            )

            if current_step_request:
                response_data["current_step"] = {
                    "id": current_step_request.id,
                    "step_number": current_step_request.step_number,
                    "status": current_step_request.status,
                    "target_department_name": current_step_request.target_department.name,
                    "employee_notes": current_step_request.employee_notes,
                    "manager_notes": current_step_request.manager_notes,
                    "rejection_reason": current_step_request.rejection_reason,
                    "created_at": current_step_request.created_at.isoformat(),
                }

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        import traceback

        error_trace = traceback.format_exc()
        print(f"Error in employee_disclaimer_status_view: {str(e)}")
        print(error_trace)
        return Response(
            {
                "error": str(e),
                "flow_steps": [],  # Return empty array even on error
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
        # if DisclaimerProcess.has_completed_process(employee):
        #     return Response(
        #         {
        #             "error": "You have already completed the disclaimer process. "
        #             "The disclaimer can only be completed once and cannot be restarted."
        #         },
        #         status=status.HTTP_400_BAD_REQUEST,
        #     )

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
            is_active=True,
            process_number=DisclaimerProcess.get_next_process_number(employee),
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
    FIXED: Submit a disclaimer request for the current step
    """
    try:
        employee = request.user.employee_profile

        # Get the active process
        active_process = DisclaimerProcess.objects.filter(
            employee=employee, status="in_progress", is_active=True
        ).first()

        if not active_process:
            return Response(
                {
                    "error": "No active disclaimer process found. Please start a process first."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get step_number and target_department from request
        step_number = request.data.get("step_number")
        target_department_id = request.data.get("target_department")
        employee_notes = request.data.get("employee_notes", "")

        if not step_number:
            return Response(
                {"error": "step_number is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not target_department_id:
            return Response(
                {"error": "target_department is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate step number
        if step_number != active_process.current_step:
            return Response(
                {
                    "error": f"Can only submit request for current step ({active_process.current_step})"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if request already exists for this step
        existing_request = DisclaimerRequest.objects.filter(
            process=active_process, step_number=step_number
        ).first()

        # If exists and is pending, cannot resubmit
        if existing_request and existing_request.status == "pending":
            return Response(
                {"error": "A request for this step is already pending"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If exists and is approved, cannot resubmit
        if existing_request and existing_request.status == "approved":
            return Response(
                {"error": "This step has already been approved"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get target department
        try:
            target_department = Department.objects.get(id=target_department_id)
        except Department.DoesNotExist:
            return Response(
                {"error": "Invalid target department"}, status=status.HTTP_404_NOT_FOUND
            )

        # If request was rejected, delete the old one before creating new
        if existing_request and existing_request.status == "rejected":
            existing_request.delete()

        # Create the request with process link
        disclaimer_request = DisclaimerRequest.objects.create(
            employee=employee,
            process=active_process,  # CRITICAL: Link to process
            target_department=target_department,
            step_number=step_number,
            employee_notes=employee_notes,
            status="pending",
        )

        result_serializer = DisclaimerRequestSerializer(disclaimer_request)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)

    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        import traceback

        print(f"Error in employee_submit_disclaimer_request_view: {str(e)}")
        print(traceback.format_exc())
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsEmployee])
def employee_disclaimer_history_view(request):
    """
    UPDATED: Get employee's disclaimer history with process information
    Returns all requests grouped by process for better history view
    """
    try:
        employee = request.user.employee_profile

        # Get all requests for this employee with process info
        requests = (
            DisclaimerRequest.objects.filter(employee=employee)
            .select_related("target_department", "reviewed_by", "process")
            .order_by("-created_at")
        )

        # Serialize with process info
        serializer = DisclaimerRequestSerializer(requests, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsEmployee])
def employee_disclaimer_processes_view(request):
    """
    NEW: Get all disclaimer processes for the employee
    Provides a complete overview of all process attempts
    """
    try:
        employee = request.user.employee_profile

        # Get all processes for this employee
        processes = (
            DisclaimerProcess.objects.filter(employee=employee)
            .prefetch_related("requests")
            .order_by("-started_at")
        )

        serializer = DisclaimerProcessSerializer(processes, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
