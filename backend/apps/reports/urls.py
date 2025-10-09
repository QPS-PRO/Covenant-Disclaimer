from django.urls import path
from . import views

urlpatterns = [
    path('', views.reports_list_view, name='reports-list'),

    path('disclaimer-completion/', views.disclaimer_completion_report, name='disclaimer-completion-report'),
    path('employee-assets/', views.employee_assets_report, name='employee-assets-report'),
    path('assets-by-status/', views.assets_by_status_report, name='assets-by-status-report'),
    path('transaction-history/', views.asset_transaction_history_report, name='transaction-history-report'),
    path('department-summary/', views.department_summary_report, name='department-summary-report'),

]