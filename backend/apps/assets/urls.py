from django.urls import path
from . import views

app_name = 'assets'

urlpatterns = [
    # Departments
    path('departments/', views.DepartmentListCreateView.as_view(), name='department-list-create'),
    path('departments/<int:pk>/', views.DepartmentDetailView.as_view(), name='department-detail'),
    
    # Employees
    path('employees/', views.EmployeeListCreateView.as_view(), name='employee-list-create'),
    path('employees/<int:pk>/', views.EmployeeDetailView.as_view(), name='employee-detail'),
    path('employees/<int:employee_id>/profile/', views.employee_profile_view, name='employee-profile'),
    
    # Face Recognition Endpoints
    path('employees/<int:employee_id>/face/', views.update_employee_face_data, name='employee-face-update'),
    path('employees/verify-face/', views.verify_face_view, name='verify-face'),
    path('employees/validate-face-image/', views.validate_face_image_view, name='validate-face-image'),
    
    # Assets
    path('assets/', views.AssetListCreateView.as_view(), name='asset-list-create'),
    path('assets/<int:pk>/', views.AssetDetailView.as_view(), name='asset-detail'),
    
    # Transactions
    path('transactions/', views.AssetTransactionListCreateView.as_view(), name='transaction-list-create'),
    path('transactions/<int:pk>/', views.AssetTransactionDetailView.as_view(), name='transaction-detail'),
    
    # Dashboard endpoints
    path('dashboard/stats/', views.dashboard_stats_view, name='dashboard-stats'),
    path('dashboard/summary/', views.dashboard_summary_view, name='dashboard-summary'),
    path('dashboard/charts/', views.dashboard_charts_data_view, name='dashboard-charts'),
]
