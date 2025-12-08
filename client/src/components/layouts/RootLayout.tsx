import { Outlet } from "react-router";
import Stack from "@mui/material/Stack";
import {
  SideBar,
  COLLAPSED_WIDTH,
  EXPANDED_WIDTH,
} from "@/components/layouts/sidebar";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
const RootLayout = () => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  return (
    <Stack direction="row" minHeight="100vh">
      <SideBar />
      <Stack
        flex={1}
        padding={12}
        overflow={"hidden"}
        sx={{
          pl: `${(isSmall ? COLLAPSED_WIDTH : 0) + 24}px`,
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.01)"
              : "rgba(0, 0, 0, 0.01)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Stack maxWidth={1280} width="100%" paddingY={theme.spacing(6)}>
          <Outlet />
        </Stack>
      </Stack>
    </Stack>
  );
};

export default RootLayout;
