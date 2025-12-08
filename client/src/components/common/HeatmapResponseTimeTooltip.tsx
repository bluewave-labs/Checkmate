import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { formatDateWithTz } from "@/utils/TimeUtils";
import { useAppSelector } from "@/hooks/AppHooks";
import type { LatestCheck } from "@/types/check";
import { useTheme } from "@mui/material/styles";

export const HeatmapResponseTimeTooltip: React.FC<{
  children: React.ReactElement;
  check: LatestCheck;
}> = ({ children, check }) => {
  const uiTimezone = useAppSelector((state: any) => state.ui.timezone);
  const theme = useTheme();

  const getColor = (status: string) => {
    if (status === "up") return theme.palette.success.light;
    if (status === "down") return theme.palette.error.light;
  };

  if (check.status === "placeholder") {
    return children;
  }
  return (
    <Tooltip
      slotProps={{
        tooltip: {
          sx: {
            backgroundColor: "transparent",
            color: "inherit",
            boxShadow: "none",
          },
        },
      }}
      title={
        <Stack
          sx={{
            backgroundColor: theme.palette.secondary.main,
            border: 1,
            borderColor: theme.palette.divider,
            borderRadius: theme.shape.borderRadius,
            p: theme.spacing(4),
          }}
        >
          <Typography>
            {formatDateWithTz(
              check?.checkedAt,
              "ddd, MMMM D, YYYY, HH:mm A",
              uiTimezone
            )}
          </Typography>
          {check?.responseTime && (
            <Typography>Response Time: {check.responseTime} ms</Typography>
          )}

          <Typography textTransform={"capitalize"}>
            Status:{" "}
            <span style={{ color: getColor(check?.status) }}>
              {check?.status}
            </span>
          </Typography>
        </Stack>
      }
    >
      {children}
    </Tooltip>
  );
};
