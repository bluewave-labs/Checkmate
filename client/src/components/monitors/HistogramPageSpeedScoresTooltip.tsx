import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useAppSelector } from "@/hooks/AppHooks";
import { formatDateWithTz } from "@/utils/TimeUtils";
import type { ConfigItem } from "@/components/monitors/HistogramPageSpeedScores";
import type { TooltipProps } from "recharts";

interface HistogramPageSpeedScoresTooltipProps
  extends Partial<TooltipProps<number, string>> {
  config: Record<string, ConfigItem>;
}
export const HistogramPageSpeedScoresTooltip = ({
  active,
  payload,
  label,
  config,
}: HistogramPageSpeedScoresTooltipProps) => {
  const theme = useTheme();
  const uiTimezone = useAppSelector((state: any) => state.ui.timezone);

  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          backgroundColor: theme.palette.primary.main,
          border: 1,
          borderColor: theme.palette.primary.lowContrast,
          borderRadius: theme.shape.borderRadius,
          py: theme.spacing(2),
          px: theme.spacing(4),
        }}
      >
        <Typography
          sx={{
            color: theme.palette.primary.contrastTextTertiary,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {formatDateWithTz(label, "ddd, MMMM D, YYYY, h:mm A", uiTimezone)}
        </Typography>
        {Object.keys(config)
          .reverse()
          .map((key) => {
            const { palette } = config[key];
            const dotColor = theme.palette[palette].main;

            return (
              <Stack
                key={`${key}-tooltip`}
                direction="row"
                alignItems="center"
                gap={theme.spacing(3)}
                mt={theme.spacing(1)}
              >
                <Box
                  width={theme.spacing(4)}
                  height={theme.spacing(4)}
                  sx={{ borderRadius: "50%", backgroundColor: dotColor }}
                />
                <Typography textTransform="capitalize" sx={{ opacity: 0.8 }}>
                  {config[key].text}
                </Typography>
                <Typography>
                  {Math.floor(payload[0].payload[key] * 100)}
                </Typography>
              </Stack>
            );
          })}
      </Box>
    );
  }
  return null;
};
