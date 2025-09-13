import {
  HomeIcon,
  UserCircleIcon,
  TableCellsIcon,
  InformationCircleIcon,
  ServerStackIcon,
  RectangleStackIcon,
  UsersIcon,
  CubeIcon,
  BuildingOfficeIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/solid";
import { Home, Profile, Tables, Notifications } from "@/pages/dashboard";
import { SignIn, SignUp } from "@/pages/auth";
import { Employees, Assets, Departments, Transactions } from "@/pages/management";

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
      },
      {
        icon: <CubeIcon {...icon} />,
        name: "assets",
        path: "/assets",
        element: <Assets />,
      },
      {
        icon: <BuildingOfficeIcon {...icon} />,
        name: "departments",
        path: "/departments",
        element: <Departments />,
      },
      {
        icon: <ArrowsRightLeftIcon {...icon} />,
        name: "transactions",
        path: "/transactions",
        element: <Transactions />,
      },
      {
        icon: <UserCircleIcon {...icon} />,
        name: "profile",
        path: "/profile",
        element: <Profile />,
      },
      {
        icon: <TableCellsIcon {...icon} />,
        name: "tables",
        path: "/tables",
        element: <Tables />,
      },
      {
        icon: <InformationCircleIcon {...icon} />,
        name: "notifications",
        path: "/notifications",
        element: <Notifications />,
      },
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