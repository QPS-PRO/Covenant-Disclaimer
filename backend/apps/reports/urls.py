from django.urls import path
from . import views

urlpatterns = [
    # Reports list
    path('', views.reports_list_view, name='reports-list'),
    
    # Working simple reports (without DRF decorators)
    path('disclaimer-completion/', views.disclaimer_completion_report_simple, name='disclaimer-completion-report'),
    path('employee-assets/', views.employee_assets_report_simple, name='employee-assets-report'),
    path('assets-by-status/', views.assets_by_status_report_simple, name='assets-by-status-report'),
    path('transaction-history/', views.transaction_history_report_simple, name='transaction-history-report'),
    path('department-summary/', views.department_summary_report_simple, name='department-summary-report'),
    
    # Test endpoints
    path('test/', views.test_report, name='test-report'),
    path('test-minimal/', views.test_report_minimal, name='test-report-minimal'),
    path('test-simple/', views.test_report_simple, name='test-report-simple'),
    path('disclaimer-completion-simple/', views.disclaimer_completion_report_simple, name='disclaimer-completion-report-simple'),
]
