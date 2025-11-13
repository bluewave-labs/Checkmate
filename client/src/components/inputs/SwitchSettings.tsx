import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import Typography from "@mui/material/Typography";
import { Settings } from "lucide-react";
import IconButton from "@mui/material/IconButton";

import { useNavigate } from "react-router";
import { useAppSelector } from "@/hooks/AppHooks";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Tooltip } from "@/components/design-elements";

export const SettingsSwitch = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

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

  const user = useAppSelector((state) => state.auth.user);

  const orgPermissions = user?.org?.permissions || [];
  const hasTeamEdit =
    orgPermissions.includes("teams.*") ||
    orgPermissions.includes("teams.write") ||
    orgPermissions.includes("*");

  const hasInvite =
    orgPermissions.includes("invite.*") ||
    orgPermissions.includes("invite.write") ||
    orgPermissions.includes("*");

  return (
    <>
      <Tooltip title="Settings" placement="top">
        <IconButton
          onClick={handleOpen}
          sx={{
            "& svg": {
              transition: "stroke 0.2s ease",
            },
            "&:hover svg path, &:hover svg line, &:hover svg polyline, &:hover svg rect, &:hover svg circle":
              {
                stroke: theme.palette.accent.main,
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
        <MenuItem onClick={() => handleClick("profile")}>
          <Typography>Profile</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleClick("settings")}>
          <Typography>General settings</Typography>
        </MenuItem>
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
