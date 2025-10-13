import {
  HomeIcon,
  ServerStackIcon,
  RectangleStackIcon,
  UsersIcon,
  CubeIcon,
  BuildingOfficeIcon,
  ArrowsRightLeftIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  DocumentCheckIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  DocumentIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import { Home } from "@/pages/dashboard";
import { SignIn, SignUp } from "@/pages/auth";
import { Employees, Assets, Departments, Transactions, EmployeeProfile } from "@/pages/management";

// Disclaimer components
import EmployeeDisclaimerPage from "@/pages/dashboard/employee-disclaimer";
import EmployeeDisclaimerHistory from "@/pages/dashboard/employee-disclaimer-history";
import ManagerDisclaimerConfiguration from "@/pages/dashboard/manager-disclaimer-config";
import ManagerPendingRequests from "@/pages/dashboard/manager-pending-requests";
import ManagerDisclaimerHistory from "@/pages/dashboard/manager-disclaimer-history";
import AdminDisclaimerConfig from "@/pages/dashboard/admin-disclaimer-config";
import AdminDisclaimerSetup from "@/pages/dashboard/admin-disclaimer-setup";
import AdminReportPermissions from "@/pages/dashboard/admin-report-permissions";
import Reports from "@/layout/ReportsDashboard";

import { isAdmin, isDepartmentManager, isRegularEmployee, hasReportAccess } from "@/utils/authHelpers";

const icon = {
  className: "w-5 h-5 text-inherit",
};

export const routes = [
  {
    layout: "dashboard",
    pages: [
      // ==================== ADMIN ONLY PAGES ====================
      {
        icon: <HomeIcon {...icon} />,
        name: "dashboard",
        path: "/home",
        element: <Home />,
        hideFromSidebar: (user) => !isAdmin(user),
      },
      {
        icon: <CubeIcon {...icon} />,
        name: "assets",
        path: "/assets",
        element: <Assets />,
        hideFromSidebar: (user) => !isAdmin(user),
      },
      {
        icon: <BuildingOfficeIcon {...icon} />,
        name: "departments",
        path: "/departments",
        element: <Departments />,
        hideFromSidebar: (user) => !isAdmin(user),
      },
      {
        icon: <UsersIcon {...icon} />,
        name: "employees",
        path: "/employees",
        element: <Employees />,
        hideFromSidebar: (user) => !isAdmin(user),
      },
      {
        icon: <ArrowsRightLeftIcon {...icon} />,
        name: "transactions",
        path: "/transactions",
        element: <Transactions />,
        hideFromSidebar: (user) => !isAdmin(user),
      },
      {
        icon: <Cog6ToothIcon {...icon} />,
        name: "Admin Config",
        path: "/admin-disclaimer-config",
        element: <AdminDisclaimerConfig />,
        hideFromSidebar: (user) => !isAdmin(user),
      },
      {
        icon: <Cog6ToothIcon {...icon} />,
        name: "Disclaimer Setup",
        path: "/admin-disclaimer-setup",
        element: <AdminDisclaimerSetup />,
        hideFromSidebar: (user) => !isAdmin(user),
      },
      {
        icon: <ShieldCheckIcon {...icon} />,
        name: "Report Permissions",
        path: "/admin-report-permissions",
        element: <AdminReportPermissions />,
        hideFromSidebar: (user) => !isAdmin(user),
      },
      {
        icon: <DocumentIcon {...icon} />,
        name: 'Reports',
        path: '/reports',
        element: <Reports />,
        hideFromSidebar: (user) => !isAdmin(user),
      },

      // ==================== MANAGER PAGES ====================
      {
        icon: <ClipboardDocumentCheckIcon {...icon} />,
        name: "Disclaimer Requests",
        path: "/disclaimer-requests",
        element: <ManagerPendingRequests />,
        hideFromSidebar: (user) => !isDepartmentManager(user),
      },
      {
        icon: <UserCircleIcon {...icon} />,
        name: "My Profile",
        path: `/employees/:id/profile`,
        element: <EmployeeProfile />,
        hideFromSidebar: (user) => !isDepartmentManager(user),
        getPath: (user) => {
          if (isDepartmentManager(user) && user?.employee_profile?.id) {
            return `/employees/${user.employee_profile.id}/profile`;
          }
          return null;
        },
      },
      {
        icon: <Cog6ToothIcon {...icon} />,
        name: "Disclaimer Setup",
        path: "/disclaimer-setup",
        element: <ManagerDisclaimerConfiguration />,
        hideFromSidebar: (user) => !isDepartmentManager(user),
      },
      {
        icon: <ClockIcon {...icon} />,
        name: "Request History",
        path: "/disclaimer-history",
        element: <ManagerDisclaimerHistory />,
        hideFromSidebar: (user) => !isDepartmentManager(user),
      },
      {
        icon: <DocumentIcon {...icon} />,
        name: 'Reports',
        path: '/manager-reports',
        element: <Reports />,
        hideFromSidebar: (user) => {
          // Debug logging
          if (isDepartmentManager(user)) {
            console.log('Manager detected, checking report access:', {
              hasAccess: hasReportAccess(user),
              reportPermission: user?.employee_profile?.report_permission
            });
          }

          // Show only if user is manager AND has report access
          return !(isDepartmentManager(user) && hasReportAccess(user));
        },
      },

      // ==================== EMPLOYEE ONLY PAGES ====================
      {
        icon: <UserCircleIcon {...icon} />,
        name: "My Profile",
        path: `/employees/:id/profile`,
        element: <EmployeeProfile />,
        hideFromSidebar: (user) => !isRegularEmployee(user),
        getPath: (user) => {
          if (isRegularEmployee(user) && user?.employee_profile?.id) {
            return `/employees/${user.employee_profile.id}/profile`;
          }
          return null;
        },
      },
      {
        icon: <DocumentCheckIcon {...icon} />,
        name: "My Disclaimer",
        path: "/my-disclaimer",
        element: <EmployeeDisclaimerPage />,
        hideFromSidebar: (user) => !isRegularEmployee(user),
      },
      {
        icon: <ClockIcon {...icon} />,
        name: "Disclaimer History",
        path: "/my-disclaimer-history",
        element: <EmployeeDisclaimerHistory />,
        hideFromSidebar: (user) => !isRegularEmployee(user),
      },
      {
        icon: <DocumentIcon {...icon} />,
        name: 'Reports',
        path: '/employee-reports',
        element: <Reports />,
        hideFromSidebar: (user) => {
          // Debug logging
          if (isRegularEmployee(user)) {
            console.log('Employee detected, checking report access:', {
              hasAccess: hasReportAccess(user),
              reportPermission: user?.employee_profile?.report_permission
            });
          }

          // Show only if user is employee AND has report access
          return !(isRegularEmployee(user) && hasReportAccess(user));
        },
      },
    ],
  },
  {
    layout: "auth",
    pages: [
      {
        icon: <ServerStackIcon {...icon} />,
        name: "sign in",
        path: "/sign-in",
        element: <SignIn />,
      },
      {
        icon: <RectangleStackIcon {...icon} />,
        name: "sign up",
        path: "/sign-up",
        element: <SignUp />,
      },
    ],
  },
];

export default routes;