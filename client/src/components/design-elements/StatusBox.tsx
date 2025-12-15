import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { BaseBox } from "@/components/design-elements";
import Background from "@/assets/images/background-grid.svg?react";
import { useTranslation } from "react-i18next";

import { useTheme } from "@mui/material/styles";

type StatusBoxProps = React.PropsWithChildren<{ children: React.ReactNode }>;

export const BGBox = ({ children }: StatusBoxProps) => {
  const theme = useTheme();
  return (
    <BaseBox
      sx={{
        overflow: "hidden",
        position: "relative",
        flex: 1,
        padding: theme.spacing(4),
      }}
    >
      <Box position="absolute" top="-10%" left="5%">
        <Background />
      </Box>
      {children}
    </BaseBox>
  );
};

const StatusBox = ({
  label,
  n,
  color,
}: {
  label: string;
  n: number;
  color: string | undefined;
}) => {
  const theme = useTheme();
  return (
    <BGBox>
      <Stack spacing={theme.spacing(4)}>
        <Typography
          variant={"h2"}
          textTransform="uppercase"
          color={theme.palette.text.secondary}
        >
          {label}
        </Typography>
        <Typography variant="h1" color={color}>
          {n}
        </Typography>
      </Stack>
    </BGBox>
  );
};

export const UpStatusBox = ({ n }: { n: number }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <StatusBox
      label={t("monitors.common.status.up")}
      n={n}
      color={theme.palette.success.light}
    />
  );
};

export const DownStatusBox = ({ n }: { n: number }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <StatusBox
      label={t("monitors.common.status.down")}
      n={n}
      color={theme.palette.error.light}
    />
  );
};

export const PausedStatusBox = ({ n }: { n: number }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <StatusBox
      label={t("monitors.common.status.paused")}
      n={n}
      color={theme.palette.warning.light}
    />
  );
};

export const InitializingStatusBox = ({ n }: { n: number }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <StatusBox
      label={t("monitors.common.status.initializing")}
      n={n}
      color={theme.palette.warning.light}
    />
  );
};
