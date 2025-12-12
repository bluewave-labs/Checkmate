import MuiBreadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { ChevronRight, Home } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Breadcrumb = ({
  breadcrumbOverride,
}: {
  breadcrumbOverride?: string[];
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const location = useLocation();

  // Don't show breadcrumb on dashboard
  if (location.pathname === "/" || location.pathname === "/uptime") {
    return null;
  }

  const pathnames =
    breadcrumbOverride || location.pathname.split("/").filter((x) => x);

  // Don't show if only one level (e.g., /uptime)
  if (pathnames.length === 0) {
    return null;
  }

  return (
    <MuiBreadcrumbs
      separator={<ChevronRight size={16} strokeWidth={1.5} />}
      sx={{
        fontSize: "14px",
        marginBottom: theme.spacing(6),
        "& .MuiBreadcrumbs-separator": {
          color: theme.palette.text.secondary,
        },
      }}
    >
      <Link
        to="/uptime"
        style={{
          display: "flex",
          alignItems: "center",
          gap: theme.spacing(2),
          textDecoration: "none",
          color: theme.palette.text.secondary,
        }}
      >
        <Home size={16} strokeWidth={1.5} />
        <Typography
          sx={{
            fontSize: "14px",
            color: theme.palette.text.secondary,
            "&:hover": {
              color: theme.palette.primary.main,
            },
          }}
        >
          Home
        </Typography>
      </Link>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;

        let displayName =
          t(`common.breadcrumbs.${value}`) ||
          value.charAt(0).toUpperCase() + value.slice(1);

        // Paths that are IDs should be detail pages
        if (value.length === 24 || value.match(/^[a-f0-9-]{36}$/)) {
          displayName = "Details";
        }

        return last ? (
          <Typography
            key={to}
            sx={{
              fontSize: "14px",
              fontWeight: 600,
              color: theme.palette.primary.main,
            }}
          >
            {displayName}
          </Typography>
        ) : (
          <Link
            key={to}
            to={to}
            style={{
              textDecoration: "none",
            }}
          >
            <Typography
              sx={{
                fontSize: "14px",
                color: theme.palette.text.secondary,
                "&:hover": {
                  color: theme.palette.primary.main,
                },
              }}
            >
              {displayName}
            </Typography>
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
};
