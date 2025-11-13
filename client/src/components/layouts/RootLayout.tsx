import { Outlet } from "react-router";
import Stack from "@mui/material/Stack";
import { SideBar } from "@/components/layouts/sidebar";
import { useTheme } from "@mui/material/styles";
const RootLayout = () => {
  const theme = useTheme();
  return (
    <Stack direction="row" minHeight="100vh">
      <SideBar />
      <Stack
        flex={1}
        padding={theme.spacing(12)}
        overflow={"hidden"}
        sx={{
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.01)'
            : 'rgba(0, 0, 0, 0.01)',
          display: 'flex',
          alignItems: 'center'
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
