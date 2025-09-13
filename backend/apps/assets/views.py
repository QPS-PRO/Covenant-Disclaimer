# backend/apps/assets/views.py
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import Department, Employee, Asset, AssetTransaction
from .serializers import (
    DepartmentSerializer, EmployeeSerializer, EmployeeCreateSerializer,
    AssetSerializer, AssetTransactionSerializer, AssetTransactionCreateSerializer,
    DashboardStatsSerializer
)

class DepartmentListCreateView(generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'manager__first_name', 'manager__last_name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

class EmployeeListCreateView(generics.ListCreateAPIView):
    queryset = Employee.objects.select_related('user', 'department').filter(is_active=True)
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'is_active']
    search_fields = ['user__first_name', 'user__last_name', 'employee_id', 'user__email']
    ordering_fields = ['user__first_name', 'created_at', 'employee_id']
    ordering = ['user__first_name']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EmployeeCreateSerializer
        return EmployeeSerializer

class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Employee.objects.select_related('user', 'department')
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        # Soft delete - mark as inactive instead of deleting
        employee = self.get_object()
        employee.is_active = False
        employee.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class AssetListCreateView(generics.ListCreateAPIView):
    queryset = Asset.objects.select_related('department', 'current_holder__user')
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'status']
    search_fields = ['name', 'serial_number', 'description']
    ordering_fields = ['name', 'created_at', 'status']
    ordering = ['name']

class AssetDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Asset.objects.select_related('department', 'current_holder__user')
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated]

class AssetTransactionListCreateView(generics.ListCreateAPIView):
    queryset = AssetTransaction.objects.select_related(
        'asset__department', 'employee__user', 'processed_by'
    )
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['transaction_type', 'asset__department', 'employee']
    search_fields = ['asset__name', 'asset__serial_number', 'employee__user__first_name']
    ordering = ['-transaction_date']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AssetTransactionCreateSerializer
        return AssetTransactionSerializer

class AssetTransactionDetailView(generics.RetrieveAPIView):
    queryset = AssetTransaction.objects.select_related(
        'asset__department', 'employee__user', 'processed_by'
    )
    serializer_class = AssetTransactionSerializer
    permission_classes = [IsAuthenticated]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_profile_view(request, employee_id):
    """Get employee profile with transaction history"""
    try:
        employee = Employee.objects.select_related('user', 'department').get(id=employee_id)
        
        # Get employee basic info
        employee_data = EmployeeSerializer(employee).data
        
        # Get transaction history
        transactions = AssetTransaction.objects.filter(employee=employee).select_related(
            'asset', 'processed_by'
        ).order_by('-transaction_date')[:50]  # Last 50 transactions
        
        transaction_data = AssetTransactionSerializer(transactions, many=True).data
        
        # Get current assets
        current_assets = Asset.objects.filter(current_holder=employee).select_related('department')
        current_assets_data = AssetSerializer(current_assets, many=True).data
        
        return Response({
            'employee': employee_data,
            'current_assets': current_assets_data,
            'transaction_history': transaction_data,
            'stats': {
                'total_transactions': transactions.count(),
                'current_assets_count': current_assets.count(),
                'total_issues': transactions.filter(transaction_type='issue').count(),
                'total_returns': transactions.filter(transaction_type='return').count(),
            }
        })
        
    except Employee.DoesNotExist:
        return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats_view(request):
    """Get dashboard statistics"""
    
    # Basic counts
    total_employees = Employee.objects.filter(is_active=True).count()
    total_assets = Asset.objects.count()
    total_departments = Department.objects.count()
    assets_assigned = Asset.objects.filter(status='assigned').count()
    assets_available = Asset.objects.filter(status='available').count()
    
    # Recent transactions (last 7 days)
    week_ago = timezone.now() - timedelta(days=7)
    recent_transactions = AssetTransaction.objects.filter(
        transaction_date__gte=week_ago
    ).count()
    
    # Weekly trends (last 7 days)
    weekly_data = []
    for i in range(7):
        date = timezone.now().date() - timedelta(days=i)
        daily_issues = AssetTransaction.objects.filter(
            transaction_date__date=date,
            transaction_type='issue'
        ).count()
        daily_returns = AssetTransaction.objects.filter(
            transaction_date__date=date,
            transaction_type='return'
        ).count()
        
        weekly_data.append({
            'date': date.strftime('%Y-%m-%d'),
            'issues': daily_issues,
            'returns': daily_returns
        })
    
    weekly_data.reverse()  # Chronological order
    
    # Department distribution
    dept_stats = Department.objects.annotate(
        employee_count=Count('employees', filter=Q(employees__is_active=True)),
        asset_count=Count('assets')
    ).values('name', 'employee_count', 'asset_count')
    
    data = {
        'total_employees': total_employees,
        'total_assets': total_assets,
        'total_departments': total_departments,
        'assets_assigned': assets_assigned,
        'assets_available': assets_available,
        'recent_transactions': recent_transactions,
        'weekly_data': weekly_data,
        'department_distribution': list(dept_stats)
    }
    
    return Response(data)