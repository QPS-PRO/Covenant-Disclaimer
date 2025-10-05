// frontend/src/layouts/dashboard.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import { IconButton } from "@material-tailwind/react";
import {
  Sidenav,
  DashboardNavbar,
  Configurator,
} from "@/widgets/layout";
import routes from "@/routes";
import { useMaterialTailwindController, setOpenConfigurator } from "@/context";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/lib/api";
import { getDefaultRoute } from "@/utils/authHelpers";

export function Dashboard() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavType } = controller;
  const { isRTL } = useLanguage();
  const { user } = useAuth();

  // Get the layout classes based on RTL/LTR
  const getLayoutClasses = () => {
    let classes = "min-h-screen bg-blue-gray-50/50";

    if (isRTL) {
      classes += " rtl-layout";
    } else {
      classes += " ltr-layout";
    }

    return classes;
  };

  const getMainContentClasses = () => {
    let classes = "p-4 transition-all duration-300";

    if (isRTL) {
      classes += " xl:mr-80";
    } else {
      classes += " xl:ml-80";
    }

    return classes;
  };

  return (
    <div className={getLayoutClasses()}>
      <Sidenav
        routes={routes}
        brandImg={
          sidenavType === "dark" ? "/img/logo-ct.png" : "/img/logo-ct-dark.png"
        }
        user={user}
      />
      <div className={getMainContentClasses()}>
        <DashboardNavbar />
        <Configurator />
        <IconButton
          size="lg"
          color="white"
          className="fixed bottom-8 right-8 z-40 rounded-full shadow-blue-gray-900/10"
          ripple={false}
          onClick={() => setOpenConfigurator(dispatch, true)}
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </IconButton>
        <Routes>
          {routes.map(
            ({ layout, pages }) =>
              layout === "dashboard" &&
              pages.map(({ path, element }) => (
                <Route exact path={path} element={element} key={path} />
              ))
          )}
          {/* Catch-all route to redirect to appropriate home based on role */}
          <Route path="*" element={<Navigate to={getDefaultRoute(user)} replace />} />
        </Routes>
        <div className="text-blue-gray-600">
        </div>
      </div>
    </div>
  );
}

Dashboard.displayName = "/src/layouts/dashboard.jsx";

export default Dashboard;