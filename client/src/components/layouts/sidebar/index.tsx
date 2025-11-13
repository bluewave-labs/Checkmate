import { useEffect } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/hooks/AppHooks";

import { CollapseButton } from "@/components/layouts/sidebar/CollapseButton";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import { Logo } from "@/components/layouts/sidebar/Logo";
import { getMenu, getBottomMenu } from "@/components/layouts/sidebar/Menu";
import { NavItem } from "@/components/layouts/sidebar/NavItem";
import { BottomControls } from "@/components/layouts/sidebar/BottomControls";
import { setSidebarOpen } from "@/features/uiSlice";

export const COLLAPSED_WIDTH = 64;
export const EXPANDED_WIDTH = 200;

export const SideBar = () => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const sideBarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const menu = getMenu(t);
  const bottomMenu = getBottomMenu(t);
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(setSidebarOpen(!isSmall));
  }, [isSmall, dispatch]);

  return (
    <Stack
      component="aside"
      position="sticky"
      top={0}
      minHeight={"100vh"}
      maxHeight={"100vh"}
      paddingTop={theme.spacing(6)}
      paddingBottom={theme.spacing(6)}
      gap={theme.spacing(6)}
      borderRight={`1px solid ${theme.palette.primary.lowContrast}`}
      width={sideBarOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH}
      sx={{
        transition: "width 650ms cubic-bezier(0.36, -0.01, 0, 0.77)",
      }}
    >
      <CollapseButton sidebarOpen={sideBarOpen} />

      <Logo sidebarOpen={sideBarOpen} />
      <List
        component="nav"
        disablePadding
        sx={{
          px: theme.spacing(6),
          height: "100%",
        }}
      >
        {menu.map((item) => {
          const selected = location.pathname.startsWith(`/${item.path}`);
          return (
            <NavItem
              key={item.path}
              item={item}
              sidebarOpen={sideBarOpen}
              selected={selected}
              onClick={() => navigate(`/${item.path}`)}
            />
          );
        })}
      </List>
      <List
        component="nav"
        disablePadding
        sx={{
          px: theme.spacing(6),
        }}
      >
        {bottomMenu.map((item) => {
          const selected = location.pathname.startsWith(`/${item.path}`);

          return (
            <NavItem
              key={item.path}
              item={item}
              sidebarOpen={sideBarOpen}
              selected={selected}
              onClick={async () => {
                if (item.url) {
                  window.open(item.url, "_blank", "noreferrer");
                } else {
                  navigate(`/${item.path}`);
                }
              }}
            />
          );
        })}
      </List>
      <Divider
        sx={{ mt: "auto", borderColor: theme.palette.primary.lowContrast }}
      />
      <BottomControls />
    </Stack>
  );
};
