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

const icon = {
  className: "w-5 h-5 text-inherit",
};

export const routes = [
  {
    layout: "dashboard",
    pages: [
      {
        icon: <HomeIcon {...icon} />,
        name: "dashboard",
        path: "/home",
        element: <Home />,
      },
      {
        icon: <UsersIcon {...icon} />,
        name: "employees",
        path: "/employees",
        element: <Employees />,
        hideFromSidebar: (user) => !user.is_staff && !user.is_department_manager,
      },
      {
        icon: <UsersIcon {...icon} />,
        name: "employee-profile",
        path: "/employees/:id/profile",
        element: <EmployeeProfile />,
        hideFromSidebar: true, // This prevents it from showing in the sidebar
      },
      {
        icon: <CubeIcon {...icon} />,
        name: "assets",
        path: "/assets",
        element: <Assets />,
        hideFromSidebar: (user) => !user.is_staff && !user.is_department_manager,
      },
      {
        icon: <BuildingOfficeIcon {...icon} />,
        name: "departments",
        path: "/departments",
        element: <Departments />,
        hideFromSidebar: (user) => !user.is_staff && !user.is_department_manager,
      },
      {
        icon: <ArrowsRightLeftIcon {...icon} />,
        name: "transactions",
        path: "/transactions",
        element: <Transactions />,
        hideFromSidebar: (user) => !user.is_staff && !user.is_department_manager,
      },  
      {
        icon: <DocumentCheckIcon {...icon} />,
        name: "My Disclaimer",
        path: "/my-disclaimer",
        element: <EmployeeDisclaimerPage />,
        // Show to all employees
      },
      {
        icon: <ClipboardDocumentCheckIcon {...icon} />,
        name: "Disclaimer Requests",
        path: "/disclaimer-requests",
        element: <ManagerPendingRequests />,
        // Only show to department managers
        hideFromSidebar: (user) => !user.is_department_manager,
      },
      {
        icon: <Cog6ToothIcon {...icon} />,
        name: "Disclaimer Setup",
        path: "/disclaimer-setup",
        element: <ManagerDisclaimerConfiguration />,
        // Only show to department managers
        hideFromSidebar: (user) => !user.is_department_manager,
      },
      {
        icon: <Cog6ToothIcon {...icon} />,
        name: "Admin Disclaimer Config",
        path: "/admin-disclaimer-config",
        element: <AdminDisclaimerConfig />,
        // Only show to admins
        hideFromSidebar: (user) => !user.is_staff,
      }
    ],
  },
  // Keep auth pages for routing but don't show them in sidebar
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