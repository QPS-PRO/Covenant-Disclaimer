// src/widgets/layout/sidenav.jsx
import PropTypes from "prop-types";
import { Link, NavLink } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  Avatar,
  Button,
  IconButton,
  Typography,
} from "@material-tailwind/react";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";

export function Sidenav({ brandImg, brandName, routes }) {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav } = controller;
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  
  const sidenavTypes = {
    dark: "bg-gradient-to-br from-gray-800 to-gray-900",
    white: "bg-white shadow-sm",
    transparent: "bg-transparent",
  };

  // Navigation translations mapping
  const getNavTranslation = (name) => {
    const navTranslations = {
      home: t('nav.home'),
      assets: t('nav.assets'),
      departments: t('nav.departments'),
      employees: t('nav.employees'),
      transactions: t('nav.transactions'),
      reports: t('nav.reports'),
      settings: t('nav.settings'),
      dashboard: t('nav.dashboard'),
    };
    return navTranslations[name.toLowerCase()] || name;
  };

  return (
    <aside
      className={`${sidenavTypes[sidenavType]} ${
        openSidenav 
          ? "translate-x-0" 
          : isRTL ? "translate-x-80" : "-translate-x-80"
      } fixed inset-0 z-50 my-4 ${isRTL ? 'mr-4' : 'ml-4'} h-[calc(100vh-32px)] w-72 rounded-xl transition-transform duration-300 ${isRTL ? 'xl:translate-x-0' : 'xl:translate-x-0'} border border-blue-gray-100`}
      style={{ 
        [isRTL ? 'right' : 'left']: isRTL ? (openSidenav ? '1rem' : '-18rem') : (openSidenav ? '1rem' : '-18rem')
      }}
    >
      <div className="relative">
        <Link to="/" className={`py-6 px-8 text-center flex items-center ${isRTL ? 'justify-center flex-row-reverse' : 'justify-center'} gap-3`}>
          {brandImg && (
            <img
              src={brandImg}
              alt="Qurtubah Schools Logo"
              className="h-8 w-8 object-contain"
            />
          )}
          <Typography
            variant="h6"
            color={sidenavType === "dark" ? "white" : "blue-gray"}
            className="font-bold"
          >
            {brandName}
          </Typography>
        </Link>
        <IconButton
          variant="text"
          color="white"
          size="sm"
          ripple={false}
          className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-0 grid ${isRTL ? 'rounded-bl-none rounded-tr-none' : 'rounded-br-none rounded-tl-none'} xl:hidden`}
          onClick={() => setOpenSidenav(dispatch, false)}
        >
          <XMarkIcon strokeWidth={2.5} className="h-5 w-5 text-white" />
        </IconButton>
      </div>
      <div className="m-4">
        {routes.map(({ layout, title, pages }, key) => (
          // Only show dashboard routes in sidebar, filter out auth routes
          layout === "dashboard" && (
            <ul key={key} className="mb-4 flex flex-col gap-1">
              {title && (
                <li className={`mx-3.5 mt-4 mb-2 ${isRTL ? 'text-right' : ''}`}>
                  <Typography
                    variant="small"
                    color={sidenavType === "dark" ? "white" : "blue-gray"}
                    className="font-black uppercase opacity-75"
                  >
                    {getNavTranslation(title)}
                  </Typography>
                </li>
              )}
              {pages
                .filter(page => !page.hideFromSidebar) // Filter out pages with hideFromSidebar: true
                .map(({ icon, name, path }) => (
                  <li key={name}>
                    <NavLink to={`/${layout}${path}`}>
                      {({ isActive }) => (
                        <Button
                          variant={isActive ? "gradient" : "text"}
                          color={
                            isActive
                              ? sidenavColor
                              : sidenavType === "dark"
                                ? "white"
                                : "blue-gray"
                          }
                          className={`flex items-center gap-4 px-4 capitalize ${isRTL ? 'flex-row-reverse text-right justify-end' : ''}`}
                          fullWidth
                        >
                          {icon}
                          <Typography
                            color="inherit"
                            className={`font-medium capitalize ${isRTL ? 'text-right' : ''}`}
                          >
                            {getNavTranslation(name)}
                          </Typography>
                        </Button>
                      )}
                    </NavLink>
                  </li>
                ))}
            </ul>
          )
        ))}
      </div>
    </aside>
  );
}

Sidenav.defaultProps = {
  brandImg: null,
  brandName: "Qurtubah Schools",
};

Sidenav.propTypes = {
  brandImg: PropTypes.string,
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

Sidenav.displayName = "/src/widgets/layout/sidenav.jsx";

export default Sidenav;