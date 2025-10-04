from django.urls import path
from . import views

urlpatterns = [
    # ============ ADMIN ENDPOINTS ============
    # Department disclaimer configuration
    path(
        "admin/department-config/",
        views.disclaimer_department_config_view,
        name="disclaimer-department-config-list",
    ),
    path(
        "admin/department-config/<int:pk>/",
        views.disclaimer_department_config_detail_view,
        name="disclaimer-department-config-detail",
    ),
    # ============ DEPARTMENT MANAGER ENDPOINTS ============
    # Disclaimer flow configuration
    path(
        "manager/disclaimer-orders/",
        views.department_disclaimer_orders_view,
        name="manager-disclaimer-orders",
    ),
    path(
        "manager/disclaimer-orders/create/",
        views.department_disclaimer_order_create_view,
        name="manager-disclaimer-order-create",
    ),
    path(
        "manager/disclaimer-orders/reorder/",
        views.department_disclaimer_orders_reorder_view,
        name="manager-disclaimer-orders-reorder",
    ),
    path(
        "manager/disclaimer-orders/<int:pk>/delete/",
        views.department_disclaimer_order_delete_view,
        name="manager-disclaimer-order-delete",
    ),
    # Review disclaimer requests
    path(
        "manager/pending-requests/",
        views.manager_pending_requests_view,
        name="manager-pending-requests",
    ),
    path(
        "manager/requests/<int:request_id>/review/",
        views.manager_review_request_view,
        name="manager-review-request",
    ),
    # ============ EMPLOYEE ENDPOINTS ============
    # Disclaimer process
    path(
        "employee/status/",
        views.employee_disclaimer_status_view,
        name="employee-disclaimer-status",
    ),
    path(
        "employee/start-process/",
        views.employee_start_disclaimer_process_view,
        name="employee-start-process",
    ),
    path(
        "employee/submit-request/",
        views.employee_submit_disclaimer_request_view,
        name="employee-submit-request",
    ),
    path(
        "employee/history/",
        views.employee_disclaimer_history_view,
        name="employee-disclaimer-history",
    ),
    # ============ GENERAL ENDPOINTS ============
    path("statistics/", views.disclaimer_statistics_view, name="disclaimer-statistics"),
]
