import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import Typography from "@mui/material/Typography";
import { Users, Check } from "lucide-react";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { Tooltip } from "@/components/design-elements";

import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/AppHooks";
import { setSelectedTeamId } from "@/features/authSlice";
import { useNavigate } from "react-router";
import { useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import { useTheme } from "@mui/material/styles";

export const TeamSwitch = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { response } = useGet<ApiResponse<any>>("/teams/joined");
  const selectedTeamId = useAppSelector((state) => state.auth.selectedTeamId);
  const user = useAppSelector((state) => state.auth.user);
  const teams = response?.data || [];

  // If the selected team is not in the list of joined teams, reset it
  // This can happen if a user is on a team and it is deleted or they are removed from it
  useEffect(() => {
    if (teams.length > 0 && !teams.find((t: any) => t._id === selectedTeamId)) {
      dispatch(setSelectedTeamId(user?.teams[0]?.id || null));
    }
  }, [teams, selectedTeamId, dispatch]);

  const handleMenu = (teamId: string) => {
    dispatch(setSelectedTeamId(teamId));
    navigate("/");
    handleClose();
  };

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title="Teams" placement="top">
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
          <Users size={16} strokeWidth={1.5} />
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
        {teams.map((t: any) => {
          return (
            <MenuItem key={t._id} onClick={() => handleMenu(t._id)}>
              <Stack
                width={"100%"}
                direction={"row"}
                justifyContent={"space-between"}
              >
                <Typography mr={2}>{t.name}</Typography>
                <Stack width={16} alignItems="center" justifyContent={"center"}>
                  {selectedTeamId === t._id && (
                    <Check size={16} strokeWidth={1.5} />
                  )}
                </Stack>
              </Stack>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};
