import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatDateWithTz } from "@/utils/TimeUtils";
import { useAppSelector } from "@/hooks/AppHooks";
import type { TooltipProps } from "recharts";
import { useTheme } from "@mui/material/styles";

export const HistogramPageSpeedTooltip = ({
  payload,
}: TooltipProps<string | number, string>) => {
  const uiTimezone = useAppSelector((state: any) => state.ui.timezone);
  const theme = useTheme();
  return (
    <Stack
      alignItems={"flex-start"}
      top={0}
      left={0}
      zIndex={10}
      sx={{
        backgroundColor: theme.palette.secondary.main,
        border: 1,
        borderColor: theme.palette.primary.lowContrast,
        borderRadius: theme.shape.borderRadius,
        p: theme.spacing(4),
      }}
    >
      <Typography color={theme.palette.primary.contrastText}>
        {formatDateWithTz(
          payload?.[0]?.payload?.date ?? 0,
          "MMMM D, YYYY, HH:mm A",
          uiTimezone
        )}
      </Typography>
      <Typography color={theme.palette.primary.contrastText}>
        Score: {payload?.[0]?.payload?.score}
      </Typography>
    </Stack>
  );
};
