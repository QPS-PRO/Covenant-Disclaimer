// frontend/src/widgets/cards/statistics-card.jsx
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
} from "@material-tailwind/react";
import PropTypes from "prop-types";
import { useLanguage } from "@/context/LanguageContext";

export function StatisticsCard({ color, icon, title, value, footer, className, ...props }) {
  const { isRTL } = useLanguage();

  return (
    <Card
      className={`relative border border-blue-gray-100 shadow-sm ${className || ""}`}
      {...props}
    >
      {/* Icon badge */}
      <CardHeader
        variant="gradient"
        color={color}
        floated={false}
        shadow={false}
        className={`absolute grid h-16 w-16 place-items-center rounded-xl shadow-md p-2
    ${isRTL ? "-left-3 md:-left-2" : "-right-3 md:-right-2"}`}
      >
        {icon}
      </CardHeader>


      {/* Text */}
      <CardBody
        className={`p-4 ${
          // leave Arabic as-is (icon on the left), move icon to the right in English
          isRTL ? "pl-6 pr-4 text-right" : "pr-6 pl-4 text-left"
          }`}
      >
        <Typography
          variant="small"
          className={`font-normal text-blue-gray-600 ${isRTL ? "text-right" : "text-left"}`}
        >
          {title}
        </Typography>
        <Typography
          variant="h4"
          color="blue-gray"
          className={isRTL ? "text-right" : "text-left"}
        >
          {value}
        </Typography>
      </CardBody>

      {footer && <CardFooter className="border-t border-blue-gray-50 p-4">{footer}</CardFooter>}
    </Card>
  );
}

StatisticsCard.defaultProps = {
  color: "blue",
  footer: null,
};

StatisticsCard.propTypes = {
  color: PropTypes.oneOf([
    "white", "blue-gray", "gray", "brown", "deep-orange", "orange", "amber", "yellow", "lime",
    "light-green", "green", "teal", "cyan", "light-blue", "blue", "indigo", "deep-purple",
    "purple", "pink", "red",
  ]),
  icon: PropTypes.node.isRequired,
  title: PropTypes.node.isRequired,
  value: PropTypes.node.isRequired,
  footer: PropTypes.node,
  className: PropTypes.string,
};

StatisticsCard.displayName = "/src/widgets/cards/statistics-card.jsx";

export default StatisticsCard;
