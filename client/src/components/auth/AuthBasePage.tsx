import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { HeaderAuth } from "@/components/auth";
import Logo from "@/assets/icons/checkmate-icon.svg?react";

import type { StackProps } from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { Typography } from "@mui/material";

interface AuthBasePageProps extends StackProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const AuthBasePage: React.FC<AuthBasePageProps> = ({
  children,
  title,
  subtitle,
  ...props
}) => {
  const theme = useTheme();
  return (
    <Stack gap={theme.spacing(10)} minHeight="100vh" {...props}>
      <HeaderAuth />
      <Stack
        alignItems="center"
        margin="auto"
        width="100%"
        gap={theme.spacing(4)}
      >
        <Box width={{ xs: 60, sm: 70, md: 80 }} mb={theme.spacing(10)}>
          <Logo style={{ width: "100%", height: "100%" }} />
        </Box>
        <Typography variant="h1">{title}</Typography>
        <Typography variant="h1">{subtitle}</Typography>
        {children}
      </Stack>
    </Stack>
  );
};
