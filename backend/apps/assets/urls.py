from django.urls import path
from . import views

urlpatterns = [
    # Department URLs
    path('departments/', views.DepartmentListCreateView.as_view(), name='department-list-create'),
    path('departments/<int:pk>/', views.DepartmentDetailView.as_view(), name='department-detail'),
    path('departments/all/', views.departments_list_all_view, name='departments-list-all'),  # For dropdowns
    
    # Employee URLs
    path('employees/', views.EmployeeListCreateView.as_view(), name='employee-list-create'),
    path('employees/<int:pk>/', views.EmployeeDetailView.as_view(), name='employee-detail'),
    path('employees/<int:employee_id>/profile/', views.employee_profile_view, name='employee-profile'),
    path('employees/all/', views.employees_list_all_view, name='employees-list-all'),  # For dropdowns
    
    # Asset URLs
    path('assets/', views.AssetListCreateView.as_view(), name='asset-list-create'),
    path('assets/<int:pk>/', views.AssetDetailView.as_view(), name='asset-detail'),
    path('assets/all/', views.assets_list_all_view, name='assets-list-all'),  # For dropdowns
    
    # Transaction URLs
    path('transactions/', views.AssetTransactionListCreateView.as_view(), name='transaction-list-create'),
    path('transactions/<int:pk>/', views.AssetTransactionDetailView.as_view(), name='transaction-detail'),
    
    # Face Recognition URLs
    path('employees/<int:employee_id>/face/', views.update_employee_face_data, name='employee-face-update'),
    path('employees/verify-face/', views.verify_face_view, name='employee-face-verify'),
    path('employees/validate-face-image/', views.validate_face_image_view, name='validate-face-image'),
    
    # Dashboard URLs
    path('dashboard/stats/', views.dashboard_stats_view, name='dashboard-stats'),
    path('dashboard/summary/', views.dashboard_summary_view, name='dashboard-summary'),
    path('dashboard/charts/', views.dashboard_charts_data_view, name='dashboard-charts'),
]