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
} from "@heroicons/react/24/solid";
import { Home } from "@/pages/dashboard";
import { SignIn, SignUp } from "@/pages/auth";
import { Employees, Assets, Departments, Transactions, EmployeeProfile } from "@/pages/management";

// Disclaimer components
import EmployeeDisclaimerPage from "@/pages/dashboard/employee-disclaimer";
import ManagerDisclaimerConfiguration from "@/pages/dashboard/manager-disclaimer-config";
import ManagerPendingRequests from "@/pages/dashboard/manager-pending-requests";
import AdminDisclaimerConfig from "@/pages/dashboard/admin-disclaimer-config";

// Import auth helpers
import { isAdmin, isDepartmentManager, isRegularEmployee } from "@/utils/authHelpers";

const icon = {
  className: "w-5 h-5 text-inherit",
};

export const routes = [
  {
    layout: "dashboard",
    pages: [
      // ADMIN ONLY PAGES
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

      // MANAGER ONLY PAGES
      {
        icon: <ClipboardDocumentCheckIcon {...icon} />,
        name: "Disclaimer Requests",
        path: "/disclaimer-requests",
        element: <ManagerPendingRequests />,
        hideFromSidebar: (user) => !isDepartmentManager(user),
      },
      {
        icon: <Cog6ToothIcon {...icon} />,
        name: "Disclaimer Setup",
        path: "/disclaimer-setup",
        element: <ManagerDisclaimerConfiguration />,
        hideFromSidebar: (user) => !isDepartmentManager(user),
      },

      // EMPLOYEE ONLY PAGES
      {
        icon: <DocumentCheckIcon {...icon} />,
        name: "My Disclaimer",
        path: "/my-disclaimer",
        element: <EmployeeDisclaimerPage />,
        hideFromSidebar: (user) => !isRegularEmployee(user),
      },

      // HIDDEN PAGES (accessible but not in sidebar)
      {
        icon: <UsersIcon {...icon} />,
        name: "employee-profile",
        path: "/employees/:id/profile",
        element: <EmployeeProfile />,
        hideFromSidebar: true,
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