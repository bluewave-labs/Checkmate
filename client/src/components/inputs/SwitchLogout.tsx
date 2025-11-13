import { LogOut } from "lucide-react";
import IconButton from "@mui/material/IconButton";
import { useAppDispatch } from "@/hooks/AppHooks";
import { logout } from "@/features/authSlice";
import { usePost } from "@/hooks/UseApi";
import { useNavigate } from "react-router";
import { useTheme } from "@mui/material/styles";
import { Tooltip } from "@/components/design-elements";

export const LogoutSwitch = () => {
  const dispatch = useAppDispatch();
  const { post } = usePost();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleClick = async () => {
    await post("/auth/logout", {});
    navigate("/login");
    dispatch(logout());
  };

  return (
    <Tooltip title="Logout" placement="top">
      <IconButton
        onClick={handleClick}
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
        <LogOut size={16} strokeWidth={1.5} />
      </IconButton>
    </Tooltip>
  );
};
