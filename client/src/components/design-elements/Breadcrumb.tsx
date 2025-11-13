import MuiBreadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import { Link, useLocation } from "react-router";
import { useTheme } from "@mui/material/styles";
import { ChevronRight, Home } from "lucide-react";

const pathNameMap: Record<string, string> = {
  uptime: "Uptime Monitors",
  pagespeed: "PageSpeed Monitors",
  infrastructure: "Infrastructure Monitors",
  diagnostics: "Diagnostics",
  incidents: "Incidents",
  maintenance: "Maintenance",
  "notification-channels": "Notification Channels",
  "status-pages": "Status Pages",
  teams: "Teams",
  settings: "Settings",
  create: "Create",
  configure: "Configure",
  invite: "Invite",
  "team-members": "Team Members",
};

export const Breadcrumb = ({
  breadcrumbOverride,
}: {
  breadcrumbOverride?: string[];
}) => {
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
          color: theme.palette.primary.contrastTextTertiary,
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
          color: theme.palette.primary.contrastTextTertiary,
        }}
      >
        <Home size={16} strokeWidth={1.5} />
        <Typography
          sx={{
            fontSize: "14px",
            color: theme.palette.primary.contrastTextTertiary,
            "&:hover": {
              color: theme.palette.accent.main,
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
          pathNameMap[value] || value.charAt(0).toUpperCase() + value.slice(1);

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
              color: theme.palette.accent.main,
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
                color: theme.palette.primary.contrastTextTertiary,
                "&:hover": {
                  color: theme.palette.accent.main,
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
