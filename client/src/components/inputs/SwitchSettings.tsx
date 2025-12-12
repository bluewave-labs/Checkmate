import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import Typography from "@mui/material/Typography";
import { Settings } from "lucide-react";
import IconButton from "@mui/material/IconButton";

import { useNavigate } from "react-router";
import { useAppSelector } from "@/hooks/AppHooks";
import { useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Tooltip } from "@/components/design-elements";
import { config } from "@/config/index";
import { useTranslation } from "react-i18next";
const DEPLOYMENT_MODE = config.DEPLOYMENT_MODE;
const IS_SAAS = DEPLOYMENT_MODE === "saas";

export const SettingsSwitch = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { t } = useTranslation();

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleClick = (path: string) => {
    navigate(path);
    handleClose();
  };

  const user = useAppSelector((state: any) => state.auth.user);

  const orgPermissions = user?.org?.permissions || [];
  // Normalize and memoize permissions for robust checks
  const perms = useMemo(
    () =>
      orgPermissions.map((p: any) => (p ?? "").toString().trim().toLowerCase()),
    [orgPermissions]
  );
  const hasTeamEdit =
    perms.includes("teams.*") ||
    perms.includes("teams.write") ||
    perms.includes("*");

  const hasInvite =
    perms.includes("invite.*") ||
    perms.includes("invite.write") ||
    perms.includes("*");

  const hasMonitorRead =
    perms.includes("monitors.*") ||
    perms.includes("monitors.read") ||
    perms.includes("*");

  const showBilling = useMemo(
    () =>
      IS_SAAS &&
      (perms.includes("*") ||
        perms.includes("billing.*") ||
        perms.includes("billing.all")),
    [perms]
  );

  const hasMaster = perms.includes("master");

  return (
    <>
      <Tooltip title={t("common.tooltips.settings")} placement="top">
        <IconButton
          onClick={handleOpen}
          sx={{
            "& svg": {
              transition: "stroke 0.2s ease",
            },
            "&:hover svg path, &:hover svg line, &:hover svg polyline, &:hover svg rect, &:hover svg circle":
              {
                stroke: theme.palette.primary.main,
              },
          }}
        >
          <Settings size={16} strokeWidth={1.5} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {showBilling && (
          <MenuItem onClick={() => handleClick("billing")}>
            <Typography>Billing</Typography>
          </MenuItem>
        )}
        {hasMonitorRead && (
          <MenuItem onClick={() => handleClick("export")}>
            <Typography>Import | Export</Typography>
          </MenuItem>
        )}
        <MenuItem onClick={() => handleClick("profile")}>
          <Typography>Profile</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleClick("settings")}>
          <Typography>General settings</Typography>
        </MenuItem>
        {hasMaster && (
          <MenuItem onClick={() => handleClick("settings/admin")}>
            <Typography>Admin settings</Typography>
          </MenuItem>
        )}
        {hasTeamEdit && (
          <MenuItem onClick={() => handleClick("teams")}>
            <Typography>Teams</Typography>
          </MenuItem>
        )}
        {hasInvite && (
          <MenuItem onClick={() => handleClick("invite")}>
            <Typography>Invite</Typography>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
