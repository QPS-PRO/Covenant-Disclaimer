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

  return (
    <aside className={getSidenavClasses()}>
      <div className="relative">
        <Link
          to="/"
          className="py-6 px-8 text-center flex items-center justify-center gap-3"
        >
          <Typography
            variant="h6"
            color={sidenavType === "dark" ? "white" : "blue-gray"}
            className="font-bold"
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
                .filter((page) => !page.hideFromSidebar)
                .map(({ icon, name, path }) => (
                  <li key={name}>
                    <NavLink to={`/${layout}${path}`}>
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
                ))}
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
};

Sidenav.propTypes = {
  brandImg: PropTypes.string,
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

Sidenav.displayName = "/src/widgets/layout/sidenav.jsx";

export default Sidenav;
