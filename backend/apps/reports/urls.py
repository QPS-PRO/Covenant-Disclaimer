from django.urls import path
from . import views

urlpatterns = [
    # Reports list
    path('', views.reports_list_view, name='reports-list'),
    
    # Disclaimer reports
    path('disclaimer-completion/', views.disclaimer_completion_report, name='disclaimer-completion-report'),
    
    # Asset reports
    path('employee-assets/', views.employee_assets_report, name='employee-assets-report'),
    path('assets-by-status/', views.assets_by_status_report, name='assets-by-status-report'),
    path('transaction-history/', views.asset_transaction_history_report, name='transaction-history-report'),
    
    # Department reports
    path('department-summary/', views.department_summary_report, name='department-summary-report'),
]
