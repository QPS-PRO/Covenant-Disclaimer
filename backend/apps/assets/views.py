# backend/apps/assets/views.py
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q, Sum
from django.utils import timezone
from datetime import timedelta, date
import hashlib
import random
from .models import Department, Employee, Asset, AssetTransaction
from .serializers import (
    DepartmentSerializer, EmployeeSerializer, EmployeeCreateSerializer, EmployeeUpdateSerializer,
    AssetSerializer, AssetTransactionSerializer, AssetTransactionCreateSerializer,
    DashboardStatsSerializer, FaceVerificationSerializer
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
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return EmployeeUpdateSerializer
        return EmployeeSerializer

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
    filterset_fields = ['transaction_type', 'asset__department', 'employee', 'face_verification_success']
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
        employee = Employee.objects.select_related('user', 'department').get(
            id=employee_id, is_active=True
        )
        
        # Get employee basic info
        employee_data = EmployeeSerializer(employee).data
        
        # Get transaction history (last 50 transactions)
        transactions = AssetTransaction.objects.filter(employee=employee).select_related(
            'asset', 'processed_by'
        ).order_by('-transaction_date')[:50]
        
        transaction_data = AssetTransactionSerializer(transactions, many=True).data
        
        # Get current assets
        current_assets = Asset.objects.filter(current_holder=employee).select_related('department')
        current_assets_data = AssetSerializer(current_assets, many=True).data
        
        # Calculate stats
        total_issues = AssetTransaction.objects.filter(
            employee=employee, transaction_type='issue'
        ).count()
        total_returns = AssetTransaction.objects.filter(
            employee=employee, transaction_type='return'
        ).count()
        
        return Response({
            'employee': employee_data,
            'current_assets': current_assets_data,
            'transaction_history': transaction_data,
            'stats': {
                'total_transactions': AssetTransaction.objects.filter(employee=employee).count(),
                'current_assets_count': current_assets.count(),
                'total_issues': total_issues,
                'total_returns': total_returns,
            }
        })
        
    except Employee.DoesNotExist:
        return Response(
            {'error': 'Employee not found or inactive'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Internal server error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_face_view(request):
    """Verify face data against stored employee face data"""
    serializer = FaceVerificationSerializer(data=request.data)
    
    if serializer.is_valid():
        employee = serializer.validated_data['employee']
        face_data = serializer.validated_data['face_data']
        
        # Perform face verification
        verification_result = perform_face_verification(
            employee.face_recognition_data,
            face_data
        )
        
        return Response({
            'success': verification_result['success'],
            'confidence': verification_result['confidence'],
            'threshold': verification_result['threshold'],
            'employee_name': employee.name,
            'employee_id': employee.employee_id
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

def perform_face_verification(stored_face_data, captured_face_data):
    """
    Perform face verification between stored and captured face data
    In production, this would integrate with a real face recognition service
    """
    try:
        # Simulate face verification process
        stored_hash = hashlib.md5(stored_face_data.encode()).hexdigest()
        captured_hash = hashlib.md5(captured_face_data.encode()).hexdigest()
        
        # Simulate confidence score
        confidence = random.uniform(0.3, 0.95)
        threshold = 0.7
        
        # Add some logic to make verification more realistic
        if stored_hash[:4] == captured_hash[:4]:
            confidence += 0.1
        
        success = confidence >= threshold
        
        return {
            'success': success,
            'confidence': round(confidence, 2),
            'threshold': threshold
        }
        
    except Exception as e:
        return {
            'success': False,
            'confidence': 0.0,
            'threshold': 0.7,
            'error': str(e)
        }

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_employee_face_data(request, employee_id):
    """Update employee face recognition data"""
    try:
        employee = Employee.objects.get(id=employee_id, is_active=True)
        face_data = request.data.get('face_recognition_data')
        
        if not face_data:
            return Response(
                {'error': 'Face recognition data is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        employee.face_recognition_data = face_data
        employee.save()
        
        return Response({
            'success': True,
            'message': 'Face recognition data updated successfully'
        })
        
    except Employee.DoesNotExist:
        return Response(
            {'error': 'Employee not found or inactive'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Internal server error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats_view(request):
    """Get comprehensive dashboard statistics"""
    
    try:
        # Basic counts
        total_employees = Employee.objects.filter(is_active=True).count()
        total_assets = Asset.objects.count()
        total_departments = Department.objects.count()
        
        # Asset status counts
        assets_assigned = Asset.objects.filter(status='assigned').count()
        assets_available = Asset.objects.filter(status='available').count()
        assets_maintenance = Asset.objects.filter(status='maintenance').count()
        assets_retired = Asset.objects.filter(status='retired').count()
        
        # Recent transactions (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        recent_transactions = AssetTransaction.objects.filter(
            transaction_date__gte=week_ago
        ).count()
        
        # Weekly trends (last 7 days)
        weekly_data = []
        for i in range(7):
            target_date = timezone.now().date() - timedelta(days=6-i)  # Start from 6 days ago
            daily_issues = AssetTransaction.objects.filter(
                transaction_date__date=target_date,
                transaction_type='issue'
            ).count()
            daily_returns = AssetTransaction.objects.filter(
                transaction_date__date=target_date,
                transaction_type='return'
            ).count()
            
            weekly_data.append({
                'date': target_date.strftime('%Y-%m-%d'),
                'issues': daily_issues,
                'returns': daily_returns
            })
        
        # Department distribution with employee and asset counts
        dept_stats = Department.objects.annotate(
            employee_count=Count('employees', filter=Q(employees__is_active=True)),
            asset_count=Count('assets')
        ).values('name', 'employee_count', 'asset_count')
        
        # Monthly trends for the current year (optional enhancement)
        current_year = timezone.now().year
        monthly_data = []
        for month in range(1, 13):
            month_issues = AssetTransaction.objects.filter(
                transaction_date__year=current_year,
                transaction_date__month=month,
                transaction_type='issue'
            ).count()
            month_returns = AssetTransaction.objects.filter(
                transaction_date__year=current_year,
                transaction_date__month=month,
                transaction_type='return'
            ).count()
            
            monthly_data.append({
                'month': month,
                'month_name': date(current_year, month, 1).strftime('%b'),
                'issues': month_issues,
                'returns': month_returns
            })
        
        # Asset value statistics (if purchase_cost is available)
        total_asset_value = Asset.objects.aggregate(
            total_value=Sum('purchase_cost')
        )['total_value'] or 0
        
        # Face verification statistics
        total_transactions_with_verification = AssetTransaction.objects.count()
        successful_verifications = AssetTransaction.objects.filter(
            face_verification_success=True
        ).count()
        
        verification_rate = 0
        if total_transactions_with_verification > 0:
            verification_rate = round(
                (successful_verifications / total_transactions_with_verification) * 100, 2
            )
        
        # Recent activity (last 24 hours)
        yesterday = timezone.now() - timedelta(days=1)
        recent_activity = {
            'new_employees': Employee.objects.filter(created_at__gte=yesterday).count(),
            'new_assets': Asset.objects.filter(created_at__gte=yesterday).count(),
            'recent_issues': AssetTransaction.objects.filter(
                transaction_date__gte=yesterday,
                transaction_type='issue'
            ).count(),
            'recent_returns': AssetTransaction.objects.filter(
                transaction_date__gte=yesterday,
                transaction_type='return'
            ).count(),
        }
        
        data = {
            # Basic counts
            'total_employees': total_employees,
            'total_assets': total_assets,
            'total_departments': total_departments,
            
            # Asset status
            'assets_assigned': assets_assigned,
            'assets_available': assets_available,
            'assets_maintenance': assets_maintenance,
            'assets_retired': assets_retired,
            
            # Transactions
            'recent_transactions': recent_transactions,
            'total_transactions': AssetTransaction.objects.count(),
            
            # Time-based data
            'weekly_data': weekly_data,
            'monthly_data': monthly_data,
            
            # Department data
            'department_distribution': list(dept_stats),
            
            # Value and verification stats
            'total_asset_value': float(total_asset_value),
            'verification_rate': verification_rate,
            'successful_verifications': successful_verifications,
            
            # Recent activity
            'recent_activity': recent_activity,
            
            # Computed metrics
            'asset_utilization_rate': round(
                (assets_assigned / total_assets * 100) if total_assets > 0 else 0, 2
            ),
            'average_assets_per_department': round(
                total_assets / total_departments if total_departments > 0 else 0, 2
            ),
            'average_assets_per_employee': round(
                assets_assigned / total_employees if total_employees > 0 else 0, 2
            ),
        }
        
        return Response(data)
        
    except Exception as e:
        return Response(
            {
                'error': 'Failed to fetch dashboard statistics',
                'detail': str(e),
                # Provide minimal fallback data
                'total_employees': 0,
                'total_assets': 0,
                'total_departments': 0,
                'assets_assigned': 0,
                'assets_available': 0,
                'recent_transactions': 0,
                'weekly_data': [],
                'department_distribution': []
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary_view(request):
    """Get quick dashboard summary for mobile or quick checks"""
    
    try:
        summary = {
            'employees': Employee.objects.filter(is_active=True).count(),
            'assets': Asset.objects.count(),
            'departments': Department.objects.count(),
            'recent_transactions': AssetTransaction.objects.filter(
                transaction_date__gte=timezone.now() - timedelta(days=7)
            ).count(),
            'assets_assigned': Asset.objects.filter(status='assigned').count(),
            'timestamp': timezone.now().isoformat(),
        }
        
        return Response(summary)
        
    except Exception as e:
        return Response(
            {'error': 'Failed to fetch dashboard summary', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_charts_data_view(request):
    """Get data specifically formatted for charts"""
    
    try:
        # Asset status pie chart data
        asset_status_data = {
            'labels': ['Assigned', 'Available', 'Maintenance', 'Retired'],
            'values': [
                Asset.objects.filter(status='assigned').count(),
                Asset.objects.filter(status='available').count(),
                Asset.objects.filter(status='maintenance').count(),
                Asset.objects.filter(status='retired').count(),
            ]
        }
        
        # Weekly transactions bar chart
        weekly_data = []
        for i in range(7):
            target_date = timezone.now().date() - timedelta(days=6-i)
            daily_data = {
                'date': target_date.strftime('%Y-%m-%d'),
                'label': target_date.strftime('%a'),
                'issues': AssetTransaction.objects.filter(
                    transaction_date__date=target_date,
                    transaction_type='issue'
                ).count(),
                'returns': AssetTransaction.objects.filter(
                    transaction_date__date=target_date,
                    transaction_type='return'
                ).count(),
            }
            weekly_data.append(daily_data)
        
        # Department assets donut chart
        dept_data = Department.objects.annotate(
            asset_count=Count('assets')
        ).values('name', 'asset_count').filter(asset_count__gt=0)
        
        department_chart_data = {
            'labels': [dept['name'] for dept in dept_data],
            'values': [dept['asset_count'] for dept in dept_data]
        }
        
        return Response({
            'asset_status': asset_status_data,
            'weekly_transactions': weekly_data,
            'department_assets': department_chart_data,
        })
        
    except Exception as e:
        return Response(
            {'error': 'Failed to fetch chart data', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )