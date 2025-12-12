import { LogOut } from "lucide-react";
import IconButton from "@mui/material/IconButton";
import { useAppDispatch } from "@/hooks/AppHooks";
import { logout } from "@/features/authSlice";
import { usePost } from "@/hooks/UseApi";
import { useNavigate } from "react-router";
import { useTheme } from "@mui/material/styles";
import { Tooltip } from "@/components/design-elements";
import { useTranslation } from "react-i18next";

export const LogoutSwitch = () => {
  const { t } = useTranslation();
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
    <Tooltip title={t("common.tooltips.logout")} placement="top">
      <IconButton
        onClick={handleClick}
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
        <LogOut size={16} strokeWidth={1.5} />
      </IconButton>
    </Tooltip>
  );
};
