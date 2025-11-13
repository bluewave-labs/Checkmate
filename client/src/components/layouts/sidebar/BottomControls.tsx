import Stack from "@mui/material/Stack";
import {
  TeamSwitch,
  ThemeSwitch,
  LogoutSwitch,
  SettingsSwitch,
} from "@/components/inputs";
import { useTheme } from "@mui/material/styles";
import { useAppSelector } from "@/hooks/AppHooks";

export const BottomControls = () => {
  const theme = useTheme();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);

  return (
    <Stack
      alignItems={sidebarOpen ? "flex-start" : "center"}
      justifyContent={"center"}
      direction={sidebarOpen ? "row" : "column"}
      py={theme.spacing(4)}
      px={theme.spacing(8)}
      gap={theme.spacing(2)}
    >
      <TeamSwitch />
      <ThemeSwitch />
      <LogoutSwitch />
      <SettingsSwitch />
    </Stack>
  );
};
