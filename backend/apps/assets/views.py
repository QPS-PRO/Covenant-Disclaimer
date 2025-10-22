from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q, Sum
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import timedelta, date
from .models import Department, Employee, Asset, AssetTransaction
from .serializers import (
    DepartmentSerializer,
    EmployeeSerializer,
    EmployeeCreateSerializer,
    EmployeeUpdateSerializer,
    AssetSerializer,
    AssetTransactionSerializer,
    AssetTransactionCreateSerializer,
    FaceVerificationSerializer,
)
from .face_recognition_service import (
    get_face_recognition_service,
    process_employee_face_registration,
    verify_employee_face,
)
from apps.utils.pagination import CustomPageNumberPagination


class DepartmentListCreateView(generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "manager__first_name", "manager__last_name"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]


class EmployeeListCreateView(generics.ListCreateAPIView):
    queryset = Employee.objects.select_related("user", "department").filter(
        is_active=True
    )
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPageNumberPagination
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["department", "is_active"]
    search_fields = [
        "user__first_name",
        "user__last_name",
        "employee_id",
        "user__email",
    ]
    ordering_fields = ["user__first_name", "created_at", "employee_id"]
    ordering = ["user__first_name"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return EmployeeCreateSerializer
        return EmployeeSerializer


class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Employee.objects.select_related("user", "department")
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return EmployeeUpdateSerializer
        return EmployeeSerializer

    def destroy(self, request, *args, **kwargs):
        employee = self.get_object()
        
        # Deactivate the employee
        employee.is_active = False
        employee.save()
        
        # Also deactivate the associated user account to prevent login
        if employee.user:
            employee.user.is_active = False
            employee.user.save()
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class AssetListCreateView(generics.ListCreateAPIView):
    queryset = Asset.objects.select_related("department", "current_holder__user")
    serializer_class = AssetSerializer
    pagination_class = CustomPageNumberPagination
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["department", "status"]
    search_fields = ["name", "serial_number", "description"]
    ordering_fields = ["name", "created_at", "status"]
    ordering = ["name"]


class AssetDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Asset.objects.select_related("department", "current_holder__user")
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        """Override destroy to check if asset can be deleted"""
        asset = self.get_object()

        try:
            if not asset.can_be_deleted():
                return Response(
                    {
                        "error": f'Cannot delete asset "{asset.name}" - it is currently assigned to {asset.current_holder.name}. Please return the asset first before deleting.',
                        "details": {
                            "asset_name": asset.name,
                            "serial_number": asset.serial_number,
                            "current_holder": asset.current_holder.name,
                            "employee_id": asset.current_holder.employee_id,
                            "status": asset.status,
                        },
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return super().destroy(request, *args, **kwargs)

        except ValidationError as e:
            return Response(
                {
                    "error": str(e),
                    "details": {
                        "asset_name": asset.name,
                        "status": asset.status,
                        "current_holder": asset.current_holder.name
                        if asset.current_holder
                        else None,
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {
                    "error": f"An error occurred while trying to delete the asset: {str(e)}"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def partial_update(self, request, *args, **kwargs):
        # ensure PATCH routes through the same policy
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """
        Policy:
        - If asset is currently 'assigned' => block any update.
        - Else: only allow changing status to 'available', 'maintenance' or 'retired'.
        - Never allow setting status to 'assigned' here.
        """
        asset = self.get_object()
        partial = True  # PATCH should be partial

        if asset.status == "assigned":
            return Response(
                {"error": "Updates are not allowed while asset status is 'assigned'. Return the asset first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_status = request.data.get("status")
        if not new_status:
            return Response({"error": "Status is required."}, status=status.HTTP_400_BAD_REQUEST)

        if new_status == "assigned":
            return Response({"error": "Status cannot be changed to 'assigned' here."},
                            status=status.HTTP_400_BAD_REQUEST)

        allowed_targets = {"available", "maintenance", "retired"}
        if new_status not in allowed_targets:
            return Response(
                {"error": "Status can only be changed to 'available', 'maintenance' or 'retired'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Build a clean payload for the serializer instead of mutating request.data
        data = {"status": new_status}
        # ensure holder is cleared for non-assigned statuses
        data["current_holder"] = None

        serializer = self.get_serializer(asset, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)



class AssetTransactionListCreateView(generics.ListCreateAPIView):
    queryset = AssetTransaction.objects.select_related(
        "asset__department", "employee__user", "processed_by"
    )
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPageNumberPagination
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = [
        "transaction_type",
        "asset__department",
        "employee",
        "face_verification_success",
    ]
    search_fields = [
        "asset__name",
        "asset__serial_number",
        "employee__user__first_name",
    ]
    ordering = ["-transaction_date"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AssetTransactionCreateSerializer
        return AssetTransactionSerializer


class AssetTransactionDetailView(generics.RetrieveAPIView):
    queryset = AssetTransaction.objects.select_related(
        "asset__department", "employee__user", "processed_by"
    )
    serializer_class = AssetTransactionSerializer
    permission_classes = [IsAuthenticated]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def employees_list_all_view(request):
    """Get all employees without pagination - for dropdowns"""
    try:
        employees = Employee.objects.select_related("user", "department").filter(
            is_active=True
        )

        department = request.GET.get("department")
        search = request.GET.get("search")

        if department:
            employees = employees.filter(department_id=department)

        if search:
            employees = employees.filter(
                Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(employee_id__icontains=search)
                | Q(user__email__icontains=search)
            )

        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {"error": "Failed to fetch employees", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def assets_list_all_view(request):
    """Get all assets without pagination - for dropdowns"""
    try:
        assets = Asset.objects.select_related("department", "current_holder__user")

        department = request.GET.get("department")
        status_filter = request.GET.get("status")
        search = request.GET.get("search")

        if department:
            assets = assets.filter(department_id=department)

        if status_filter:
            assets = assets.filter(status=status_filter)

        if search:
            assets = assets.filter(
                Q(name__icontains=search)
                | Q(serial_number__icontains=search)
                | Q(description__icontains=search)
            )

        serializer = AssetSerializer(assets, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {"error": "Failed to fetch assets", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def departments_list_all_view(request):
    """Get all departments without pagination - for dropdowns"""
    try:
        departments = Department.objects.all()

        search = request.GET.get("search")
        if search:
            departments = departments.filter(
                Q(name__icontains=search)
                | Q(manager__first_name__icontains=search)
                | Q(manager__last_name__icontains=search)
            )

        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {"error": "Failed to fetch departments", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def departments_public_list_view(request):
    """Public endpoint: Get all departments for sign-up page (no authentication required)"""
    try:
        departments = Department.objects.all().order_by('name')
        
        # Simple serialization - just id and name for sign-up dropdown
        data = [{"id": dept.id, "name": dept.name} for dept in departments]
        return Response({"results": data})
    except Exception as e:
        return Response(
            {"error": "Failed to fetch departments", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats_view(request):
    """Get comprehensive dashboard statistics"""

    try:
        # Basic counts
        total_employees = Employee.objects.filter(is_active=True).count()
        total_assets = Asset.objects.count()
        total_departments = Department.objects.count()

        # Asset status counts
        assets_assigned = Asset.objects.filter(status="assigned").count()
        assets_available = Asset.objects.filter(status="available").count()
        assets_maintenance = Asset.objects.filter(status="maintenance").count()
        assets_retired = Asset.objects.filter(status="retired").count()

        # Recent transactions (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        recent_transactions = AssetTransaction.objects.filter(
            transaction_date__gte=week_ago
        ).count()

        # Weekly trends (last 7 days)
        weekly_data = []
        for i in range(7):
            target_date = timezone.now().date() - timedelta(
                days=6 - i
            )  # Start from 6 days ago
            daily_issues = AssetTransaction.objects.filter(
                transaction_date__date=target_date, transaction_type="issue"
            ).count()
            daily_returns = AssetTransaction.objects.filter(
                transaction_date__date=target_date, transaction_type="return"
            ).count()

            weekly_data.append(
                {
                    "date": target_date.strftime("%Y-%m-%d"),
                    "issues": daily_issues,
                    "returns": daily_returns,
                }
            )

        # Department distribution with correct asset counts
        dept_stats = (
            Department.objects.annotate(
                employee_count=Count(
                    "employees", filter=Q(employees__is_active=True), distinct=True
                ),
                asset_count=Count("assets", distinct=True),
            )
            .values("name", "employee_count", "asset_count")
            .order_by("name")
        )

        # Monthly trends for the current year
        current_year = timezone.now().year
        monthly_data = []
        for month in range(1, 13):
            month_issues = AssetTransaction.objects.filter(
                transaction_date__year=current_year,
                transaction_date__month=month,
                transaction_type="issue",
            ).count()
            month_returns = AssetTransaction.objects.filter(
                transaction_date__year=current_year,
                transaction_date__month=month,
                transaction_type="return",
            ).count()

            monthly_data.append(
                {
                    "month": month,
                    "month_name": date(current_year, month, 1).strftime("%b"),
                    "issues": month_issues,
                    "returns": month_returns,
                }
            )

        # Asset value statistics
        total_asset_value = (
            Asset.objects.aggregate(total_value=Sum("purchase_cost"))["total_value"]
            or 0
        )

        # Face verification statistics
        total_transactions_with_verification = AssetTransaction.objects.count()
        successful_verifications = AssetTransaction.objects.filter(
            face_verification_success=True
        ).count()

        verification_rate = 0
        if total_transactions_with_verification > 0:
            verification_rate = round(
                (successful_verifications / total_transactions_with_verification) * 100,
                2,
            )

        # Recent activity (last 24 hours)
        yesterday = timezone.now() - timedelta(days=1)
        recent_activity = {
            "new_employees": Employee.objects.filter(created_at__gte=yesterday).count(),
            "new_assets": Asset.objects.filter(created_at__gte=yesterday).count(),
            "recent_issues": AssetTransaction.objects.filter(
                transaction_date__gte=yesterday, transaction_type="issue"
            ).count(),
            "recent_returns": AssetTransaction.objects.filter(
                transaction_date__gte=yesterday, transaction_type="return"
            ).count(),
        }

        data = {
            # Basic counts
            "total_employees": total_employees,
            "total_assets": total_assets,
            "total_departments": total_departments,
            # Asset status
            "assets_assigned": assets_assigned,
            "assets_available": assets_available,
            "assets_maintenance": assets_maintenance,
            "assets_retired": assets_retired,
            # Transactions
            "recent_transactions": recent_transactions,
            "total_transactions": AssetTransaction.objects.count(),
            # Time-based data
            "weekly_data": weekly_data,
            "monthly_data": monthly_data,
            # Department data
            "department_distribution": list(dept_stats),
            # Value and verification stats
            "total_asset_value": float(total_asset_value),
            "verification_rate": verification_rate,
            "successful_verifications": successful_verifications,
            # Recent activity
            "recent_activity": recent_activity,
            # Computed metrics
            "asset_utilization_rate": round(
                (assets_assigned / total_assets * 100) if total_assets > 0 else 0, 2
            ),
            "average_assets_per_department": round(
                total_assets / total_departments if total_departments > 0 else 0, 2
            ),
            "average_assets_per_employee": round(
                assets_assigned / total_employees if total_employees > 0 else 0, 2
            ),
        }

        return Response(data)

    except Exception as e:
        return Response(
            {
                "error": "Failed to fetch dashboard statistics",
                "detail": str(e),
                "total_employees": 0,
                "total_assets": 0,
                "total_departments": 0,
                "assets_assigned": 0,
                "assets_available": 0,
                "recent_transactions": 0,
                "weekly_data": [],
                "department_distribution": [],
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_summary_view(request):
    """Get quick dashboard summary for mobile or quick checks"""

    try:
        summary = {
            "employees": Employee.objects.filter(is_active=True).count(),
            "assets": Asset.objects.count(),
            "departments": Department.objects.count(),
            "recent_transactions": AssetTransaction.objects.filter(
                transaction_date__gte=timezone.now() - timedelta(days=7)
            ).count(),
            "assets_assigned": Asset.objects.filter(status="assigned").count(),
            "timestamp": timezone.now().isoformat(),
        }

        return Response(summary)

    except Exception as e:
        return Response(
            {"error": "Failed to fetch dashboard summary", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_charts_data_view(request):
    """Get data specifically formatted for charts"""

    try:
        # Asset status pie chart data
        asset_status_data = {
            "labels": ["Assigned", "Available", "Maintenance", "Retired"],
            "values": [
                Asset.objects.filter(status="assigned").count(),
                Asset.objects.filter(status="available").count(),
                Asset.objects.filter(status="maintenance").count(),
                Asset.objects.filter(status="retired").count(),
            ],
        }

        # Weekly transactions bar chart
        weekly_data = []
        for i in range(7):
            target_date = timezone.now().date() - timedelta(days=6 - i)
            daily_data = {
                "date": target_date.strftime("%Y-%m-%d"),
                "label": target_date.strftime("%a"),
                "issues": AssetTransaction.objects.filter(
                    transaction_date__date=target_date, transaction_type="issue"
                ).count(),
                "returns": AssetTransaction.objects.filter(
                    transaction_date__date=target_date, transaction_type="return"
                ).count(),
            }
            weekly_data.append(daily_data)

        # Department assets chart with proper asset counts
        dept_data = (
            Department.objects.annotate(asset_count=Count("assets", distinct=True))
            .values("name", "asset_count")
            .filter(asset_count__gt=0)
            .order_by("name")
        )

        department_chart_data = {
            "labels": [dept["name"] for dept in dept_data],
            "values": [dept["asset_count"] for dept in dept_data],
        }

        return Response(
            {
                "asset_status": asset_status_data,
                "weekly_transactions": weekly_data,
                "department_assets": department_chart_data,
            }
        )

    except Exception as e:
        return Response(
            {"error": "Failed to fetch chart data", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_face_view(request):
    """Verify face data against stored employee face data"""
    serializer = FaceVerificationSerializer(data=request.data)

    if serializer.is_valid():
        employee = serializer.validated_data["employee"]
        face_data = serializer.validated_data["face_data"]

        verification_result = verify_employee_face(employee, face_data)

        return Response(
            {
                "success": verification_result["success"],
                "confidence": verification_result.get("confidence", 0.0),
                "threshold": verification_result.get("threshold", 0.6),
                "face_distance": verification_result.get("face_distance"),
                "employee_name": employee.name,
                "employee_id": employee.employee_id,
                "error": verification_result.get("error"),
                "match_details": verification_result.get("match_details", {}),
                "quality_info": {
                    "captured_quality": verification_result.get("captured_quality", {}),
                    "stored_quality": verification_result.get("stored_quality", {}),
                },
            }
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_employee_face_data(request, employee_id):
    try:
        employee = Employee.objects.get(id=employee_id, is_active=True)
        face_image_data = request.data.get("face_recognition_data")

        if not face_image_data:
            return Response(
                {"error": "Face image data is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = process_employee_face_registration(employee, face_image_data)

        if result["success"]:
            return Response(
                {
                    "success": True,
                    "message": result["message"],
                    "quality_score": result["quality_score"],
                }
            )
        else:
            return Response(
                {
                    "success": False,
                    "error": result["error"],
                    "issues": result.get("issues", []),
                    "recommendations": result.get("recommendations", []),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee not found or inactive"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"error": f"Internal server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def validate_face_image_view(request):
    """Validate if an image is suitable for face recognition"""
    try:
        face_image_data = request.data.get("face_image_data")

        if not face_image_data:
            return Response(
                {"error": "Face image data is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service = get_face_recognition_service()
        validation_result = service.validate_image_quality(face_image_data)

        return Response(validation_result)

    except Exception as e:
        return Response(
            {"error": f"Image validation failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def employee_profile_view(request, employee_id):
    """
    GET /api/employees/{id}/profile/
    Get comprehensive employee profile data including stats, current assets, and transaction history
    """
    try:
        employee = Employee.objects.select_related("user", "department").get(
            id=employee_id, is_active=True
        )

        # Basic employee data
        employee_data = EmployeeSerializer(employee).data

        # Get current assets assigned to this employee
        current_assets = Asset.objects.filter(current_holder=employee).select_related(
            "department"
        )
        current_assets_data = AssetSerializer(current_assets, many=True).data

        # Get transaction history (limit to recent 50 for performance)
        transactions = (
            AssetTransaction.objects.filter(employee=employee)
            .select_related("asset", "processed_by")
            .order_by("-transaction_date")[:50]
        )
        transaction_data = AssetTransactionSerializer(transactions, many=True).data

        # Calculate statistics
        all_transactions = AssetTransaction.objects.filter(employee=employee)

        # Group transactions by type
        transactions_by_type = all_transactions.values("transaction_type").annotate(
            total=Count("id")
        )

        by_type = {"issue": 0, "return": 0}
        for row in transactions_by_type:
            transaction_type = row["transaction_type"]
            if transaction_type in by_type:
                by_type[transaction_type] = row["total"]

        # Face verification statistics
        face_verified_transactions = all_transactions.filter(
            face_verification_success=True
        ).count()

        total_transactions = all_transactions.count()
        face_verification_rate = 0
        if total_transactions > 0:
            face_verification_rate = (
                face_verified_transactions / total_transactions
            ) * 100

        # Build response
        stats = {
            "total_transactions": total_transactions,
            "current_assets_count": current_assets.count(),
            "face_verified_transactions": face_verified_transactions,
            "face_verification_rate": round(face_verification_rate, 2),
            "transactions_by_type": {
                "issue": by_type["issue"],  # Frontend expects 'issue'
                "return": by_type["return"],
            },
            "total_issues": by_type["issue"],
            "total_returns": by_type["return"],
            "has_face_data": bool(employee.face_recognition_data),
        }

        return Response(
            {
                "employee": employee_data,
                "current_assets": current_assets_data,
                "transaction_history": transaction_data,
                "stats": stats,
            }
        )

    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee not found or inactive"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"error": f"Internal server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def employee_current_assets_view(request, employee_id):
    """
    GET /api/employees/{id}/current-assets/
    Get current assets assigned to an employee
    """
    try:
        employee = Employee.objects.get(id=employee_id, is_active=True)

        current_assets = (
            Asset.objects.filter(current_holder=employee)
            .select_related("department")
            .order_by("name")
        )

        serializer = AssetSerializer(current_assets, many=True)

        return Response(
            {
                "employee_id": employee_id,
                "employee_name": employee.name,
                "current_assets_count": current_assets.count(),
                "current_assets": serializer.data,
            }
        )

    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee not found or inactive"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"error": f"Internal server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def employee_transactions_view(request, employee_id):
    """
    GET /api/employees/{id}/transactions/
    Get transaction history for an employee with pagination
    """
    try:
        employee = Employee.objects.get(id=employee_id, is_active=True)

        # Get query parameters
        transaction_type = request.GET.get("transaction_type")
        page = int(request.GET.get("page", 1))
        page_size = min(int(request.GET.get("page_size", 20)), 100)  # Max 100 per page

        # Build queryset
        transactions = AssetTransaction.objects.filter(
            employee=employee
        ).select_related("asset", "processed_by")

        # Filter by transaction type if specified
        if transaction_type in ["issue", "return"]:
            transactions = transactions.filter(transaction_type=transaction_type)

        # Order by most recent first
        transactions = transactions.order_by("-transaction_date")

        # Calculate pagination
        total_count = transactions.count()
        start = (page - 1) * page_size
        end = start + page_size

        # Get paginated results
        paginated_transactions = transactions[start:end]

        serializer = AssetTransactionSerializer(paginated_transactions, many=True)

        # Calculate pagination info
        total_pages = (total_count + page_size - 1) // page_size
        has_next = page < total_pages
        has_previous = page > 1

        return Response(
            {
                "employee_id": employee_id,
                "employee_name": employee.name,
                "transactions": serializer.data,
                "pagination": {
                    "current_page": page,
                    "total_pages": total_pages,
                    "total_count": total_count,
                    "page_size": page_size,
                    "has_next": has_next,
                    "has_previous": has_previous,
                    "next_page": page + 1 if has_next else None,
                    "previous_page": page - 1 if has_previous else None,
                },
                "filters": {"transaction_type": transaction_type},
            }
        )

    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee not found or inactive"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except ValueError as e:
        return Response(
            {"error": "Invalid page or page_size parameter"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {"error": f"Internal server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def employee_stats_view(request, employee_id):
    """
    GET /api/employees/{id}/stats/
    Get detailed statistics for an employee
    """
    try:
        employee = Employee.objects.get(id=employee_id, is_active=True)

        # Get all transactions for this employee
        all_transactions = AssetTransaction.objects.filter(employee=employee)

        # Current assets count
        current_assets_count = Asset.objects.filter(current_holder=employee).count()

        # Transaction counts by type
        transactions_by_type = all_transactions.values("transaction_type").annotate(
            total=Count("id")
        )

        by_type = {"issue": 0, "return": 0}
        for row in transactions_by_type:
            transaction_type = row["transaction_type"]
            if transaction_type in by_type:
                by_type[transaction_type] = row["total"]

        # Face verification statistics
        face_verified_count = all_transactions.filter(
            face_verification_success=True
        ).count()

        total_transactions = all_transactions.count()
        face_verification_rate = 0
        if total_transactions > 0:
            face_verification_rate = (face_verified_count / total_transactions) * 100

        # Recent activity (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_transactions = all_transactions.filter(
            transaction_date__gte=thirty_days_ago
        ).count()

        # Monthly transaction trends (last 6 months)
        monthly_trends = []
        for i in range(6):
            month_start = timezone.now().replace(day=1) - timedelta(days=30 * i)
            if i < 5:
                month_end = timezone.now().replace(day=1) - timedelta(days=30 * (i - 1))
            else:
                month_end = timezone.now()

            month_transactions = all_transactions.filter(
                transaction_date__gte=month_start, transaction_date__lt=month_end
            )

            monthly_trends.insert(
                0,
                {
                    "month": month_start.strftime("%Y-%m"),
                    "month_name": month_start.strftime("%b %Y"),
                    "total_transactions": month_transactions.count(),
                    "issues": month_transactions.filter(
                        transaction_type="issue"
                    ).count(),
                    "returns": month_transactions.filter(
                        transaction_type="return"
                    ).count(),
                },
            )

        # Asset condition statistics (for returns)
        return_conditions = (
            all_transactions.filter(transaction_type="return")
            .exclude(return_condition__isnull=True)
            .exclude(return_condition="")
            .values("return_condition")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        stats = {
            "employee_id": employee_id,
            "employee_name": employee.name,
            "has_face_data": bool(employee.face_recognition_data),
            # Current status
            "current_assets_count": current_assets_count,
            "is_active": employee.is_active,
            # Transaction statistics
            "total_transactions": total_transactions,
            "transactions_by_type": {
                "issue": by_type["issue"],
                "return": by_type["return"],
            },
            "total_issues": by_type["issue"],
            "total_returns": by_type["return"],
            # Face verification
            "face_verified_transactions": face_verified_count,
            "face_verification_rate": round(face_verification_rate, 2),
            # Time-based statistics
            "recent_activity": {
                "last_30_days_transactions": recent_transactions,
            },
            "monthly_trends": monthly_trends,
            # Return condition statistics
            "return_conditions": list(return_conditions),
            # Calculated metrics
            "average_monthly_transactions": round(total_transactions / 12, 2),
            "return_rate": round(
                (by_type["return"] / by_type["issue"] * 100)
                if by_type["issue"] > 0
                else 0,
                2,
            ),
        }

        return Response(stats)

    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee not found or inactive"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"error": f"Internal server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def asset_return_view(request):
    """
    POST /api/assets/return/
    Process asset return with face verification and condition assessment
    """
    try:
        # Extract data from request
        asset_id = request.data.get("asset_id")
        employee_id = request.data.get("employee_id")
        return_condition = request.data.get("return_condition")
        damage_notes = request.data.get("damage_notes", "")
        notes = request.data.get("notes", "")
        face_verification_data = request.data.get("face_verification_data")

        # Validate required fields
        if not all([asset_id, employee_id, return_condition]):
            return Response(
                {"error": "asset_id, employee_id, and return_condition are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get asset and employee
        try:
            asset = Asset.objects.select_related("current_holder").get(id=asset_id)
            employee = Employee.objects.get(id=employee_id, is_active=True)
        except Asset.DoesNotExist:
            return Response(
                {"error": "Asset not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Employee.DoesNotExist:
            return Response(
                {"error": "Employee not found or inactive"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Validate asset can be returned
        if asset.status != "assigned":
            return Response(
                {
                    "error": f"Asset '{asset.name}' is not currently assigned (status: {asset.status})"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if asset.current_holder != employee:
            current_holder_name = (
                asset.current_holder.name if asset.current_holder else "None"
            )
            return Response(
                {
                    "error": f"Asset '{asset.name}' is not assigned to {employee.name} (currently assigned to: {current_holder_name})"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Face verification if employee has face data
        face_verification_success = False
        face_verification_confidence = 0.0

        if employee.face_recognition_data:
            if not face_verification_data:
                return Response(
                    {
                        "error": f"Face verification is required for employee '{employee.name}' who has registered face data"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Perform face verification
            verification_result = verify_employee_face(employee, face_verification_data)

            if not verification_result["success"]:
                error_msg = f"Face verification failed: {verification_result.get('error', 'Unknown error')}"
                if verification_result.get("confidence"):
                    confidence_pct = verification_result["confidence"] * 100
                    threshold_pct = verification_result.get("threshold", 0.6) * 100
                    error_msg += f" (Confidence: {confidence_pct:.1f}%, Required: {threshold_pct:.0f}%)"

                return Response(
                    {"error": error_msg, "verification_details": verification_result},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            face_verification_success = True
            face_verification_confidence = verification_result.get("confidence", 0.0)

        # Create return transaction
        transaction = AssetTransaction.objects.create(
            asset=asset,
            employee=employee,
            transaction_type="return",
            return_condition=return_condition,
            damage_notes=damage_notes,
            notes=notes,
            face_verification_success=face_verification_success,
            face_verification_confidence=face_verification_confidence,
            processed_by=request.user,
        )

        # Update asset status
        asset.status = "available"
        asset.current_holder = None
        asset.save()

        # Serialize response
        transaction_data = AssetTransactionSerializer(transaction).data

        return Response(
            {
                "success": True,
                "message": f"Asset '{asset.name}' returned successfully",
                "transaction": transaction_data,
                "asset": AssetSerializer(asset).data,
                "face_verification": {
                    "success": face_verification_success,
                    "confidence": face_verification_confidence,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        return Response(
            {"error": f"Internal server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
