import Stack from "@mui/material/Stack";

import { useTheme } from "@mui/material/styles";
import { LanguageSelector, ThemeSwitch } from "@/components/inputs";

export const HeaderAuth = () => {
  const theme = useTheme();
  return (
    <Stack
      width={"100%"}
      direction="row"
      alignItems="center"
      justifyContent="flex-end"
      py={theme.spacing(4)}
      px={theme.spacing(12)}
      gap={theme.spacing(4)}
    >
      <LanguageSelector />
      <ThemeSwitch />
    </Stack>
  );
};
