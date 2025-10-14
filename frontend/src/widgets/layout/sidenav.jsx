import PropTypes from "prop-types";
import { Link, NavLink } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  Button,
  IconButton,
  Typography,
} from "@material-tailwind/react";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import React from "react";

export function Sidenav({ brandImg, brandName, routes, user }) {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav } = controller;
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const sidenavTypes = {
    dark: "bg-gradient-to-br from-gray-800 to-gray-900",
    white: "bg-white shadow-sm",
    transparent: "bg-transparent",
  };

  const getNavTranslation = (name) => {
    const navTranslations = {
      home: t("nav.home"),
      assets: t("nav.assets"),
      departments: t("nav.departments"),
      employees: t("nav.employees"),
      transactions: t("nav.transactions"),
      reports: t("nav.reports"),
      settings: t("nav.settings"),
      dashboard: t("nav.dashboard"),
      "my profile": t("nav.myProfile", { defaultValue: "My Profile" }),
      "my disclaimer": t("nav.myDisclaimer", { defaultValue: "My Disclaimer" }),
      "disclaimer requests": t("nav.disclaimerRequests", { defaultValue: "Disclaimer Requests" }),
      "disclaimer setup": t("nav.disclaimerSetup", { defaultValue: "Disclaimer Setup" }),
      "admin config": t("nav.adminDisclaimerConfig", { defaultValue: "Disclaimer Departments" }),
      "disclaimer history": t("nav.disclaimerHistory", { defaultValue: "Disclaimer History" }),
      "request history": t("nav.disclaimerHistory", { defaultValue: "Request History" }),
      "report permissions": t("nav.reportPermissions", { defaultValue: "Report Permissions" }),
    };
    return navTranslations[name.toLowerCase()] || name;
  };

  const getSidenavClasses = () => {
    let classes = `${sidenavTypes[sidenavType]} fixed inset-0 z-50 my-4 h-[calc(100vh-32px)] w-72 rounded-xl transition-transform duration-300 border border-blue-gray-100`;
    if (isRTL) {
      classes += ` right-4 left-auto ${openSidenav ? "translate-x-0" : "translate-x-full"} xl:translate-x-0`;
    } else {
      classes += ` left-4 right-auto ${openSidenav ? "translate-x-0" : "-translate-x-full"} xl:translate-x-0`;
    }
    return classes;
  };

  const withOptionalRtlFlip = (iconEl) => {
    if (!React.isValidElement(iconEl)) return iconEl;
    const extra = isRTL ? "flip-rtl" : "";
    const nextClass = `${iconEl.props.className || ""} ${extra}`.trim();
    return React.cloneElement(iconEl, { className: nextClass });
  };

  // Function to check if a page should be hidden
  const shouldHidePage = (page) => {
    // If hideFromSidebar is explicitly true, hide it
    if (page.hideFromSidebar === true) {
      return true;
    }

    // If hideFromSidebar is a function, call it with user data
    if (typeof page.hideFromSidebar === 'function') {
      return page.hideFromSidebar(user || {});
    }

    // Otherwise, show the page
    return false;
  };

  return (
    <aside className={getSidenavClasses()}>
      <div className="relative">
        <Link
          to="/"
          className="py-6 px-8 text-center flex items-center justify-center gap-3"
        >
          <img
            src={brandImg ?? "/img/logo.png"}
            alt={brandName || "Qurtubah Schools"}
            className="h-12 w-auto sm:h-10 md:h-12 shrink-0 object-contain"
            loading="lazy"
          />
          <Typography
            variant="h6"
            color={sidenavType === "dark" ? "white" : "blue-gray"}
            className="font-bold leading-none"
          >
            {t("nav.qurtubahSchools", { defaultValue: brandName || "Qurtubah Schools" })}
          </Typography>
        </Link>

        <IconButton
          variant="text"
          color="white"
          size="sm"
          ripple={false}
          className={`absolute ${isRTL
            ? "left-0 rounded-bl-none rounded-tr-none"
            : "right-0 rounded-br-none rounded-tl-none"
            } top-0 grid xl:hidden`}
          onClick={() => setOpenSidenav(dispatch, false)}
        >
          <XMarkIcon strokeWidth={2.5} className="h-5 w-5 text-white" />
        </IconButton>
      </div>

      <div className="m-4">
        {routes.map(({ layout, title, pages }, key) =>
          layout === "dashboard" ? (
            <ul key={key} className="mb-4 flex flex-col gap-1">
              {title ? (
                <li className="mx-3.5 mt-4 mb-2">
                  <Typography
                    variant="small"
                    color={sidenavType === "dark" ? "white" : "blue-gray"}
                    className={`font-black uppercase opacity-75 block w-full ${isRTL ? "text-right" : "text-left"
                      }`}
                  >
                    {getNavTranslation(title)}
                  </Typography>
                </li>
              ) : null}

              {pages
                .filter((page) => !shouldHidePage(page))
                .map(({ icon, name, path, getPath }) => {
                  // FIXED: Handle dynamic paths for employee profile
                  const dynamicPath = getPath ? getPath(user) : null;
                  const finalPath = dynamicPath || path;

                  // Skip if dynamic path returns null (user doesn't have required data)
                  if (getPath && !dynamicPath) {
                    return null;
                  }

                  return (
                    <li key={name}>
                      <NavLink to={`/${layout}${finalPath}`}>
                        {({ isActive }) => (
                          <Button
                            variant={isActive ? "gradient" : "text"}
                            color={
                              isActive
                                ? sidenavColor
                                : sidenavType === "dark" ? "white" : "blue-gray"
                            }
                            className="w-full px-4 py-3"
                            fullWidth
                          >
                            <div
                              className={`flex items-center gap-4 w-full ${isRTL ? "justify-end" : "justify-start"}`}
                              dir={isRTL ? "rtl" : "ltr"}
                            >
                              <span className="shrink-0">
                                {withOptionalRtlFlip(icon)}
                              </span>

                              <Typography
                                color="inherit"
                                className={`font-medium capitalize ${isRTL ? "text-right" : "text-left"} flex-1`}
                              >
                                {getNavTranslation(name)}
                              </Typography>
                            </div>
                          </Button>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
            </ul>
          ) : null
        )}
      </div>
    </aside>
  );
}

Sidenav.defaultProps = {
  brandImg: null,
  brandName: "Qurtubah Schools",
  user: null,
};

Sidenav.propTypes = {
  brandImg: PropTypes.string,
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
  user: PropTypes.object,
};

Sidenav.displayName = "/src/widgets/layout/sidenav.jsx";

export default Sidenav;