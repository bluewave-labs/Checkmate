import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import type { ResponsiveStyleValue } from "@mui/system";
import type { Check } from "@/types/check";
import { normalizeResponseTimes, getResponseColor } from "@/utils/DataUtils";
import { HeatmapResponseTimeTooltip } from "./HeatmapResponseTimeTooltip";

interface HistogramResponseTimeProps {
  checks: Check[];
  height?: ResponsiveStyleValue<number | string>;
  gap?: ResponsiveStyleValue<number | string>;
}

const DEFAULT_HEIGHT = 38;
const STATUS_ROW_HEIGHT = 4;

export const HistogramResponseTime = ({
  checks,
  height = DEFAULT_HEIGHT,
  gap,
}: HistogramResponseTimeProps) => {
  const theme = useTheme();

  if (!Array.isArray(checks) || checks.length === 0) return null;

  const normalized = normalizeResponseTimes(
    checks.slice(-25).reverse(),
    "responseTime"
  );
  let data = Array<any>();

  if (!normalized || normalized.length === 0) {
    data = [];
  }
  if (normalized.length !== 25) {
    const placeholders = Array(25 - normalized.length).fill({
      status: "placeholder",
    });
    data = [...normalized, ...placeholders];
  } else {
    data = normalized;
  }

  const barHeight = typeof height === "number" ? height : DEFAULT_HEIGHT;
  const gridGap = gap ?? "3px";

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {/* Response time bars row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: gridGap,
            height: barHeight,
          }}
        >
          {data.map((check, index) => {
            const isPlaceholder = check.status === "placeholder";
            const heightPct = Math.max(
              15,
              Math.min(100, check.normalResponseTime ?? 0)
            );

            const barColor = isPlaceholder
              ? "transparent"
              : getResponseColor(check.responseTime, {
                  start: theme.palette.success.main,
                  mid: theme.palette.warning.main,
                  end: theme.palette.error.main,
                });

            const barContent = (
              <Box
                sx={{
                  flex: 1,
                  height: "100%",
                  display: "flex",
                  alignItems: "flex-end",
                  bgcolor: theme.palette.grey[100],
                  borderRadius: "4px",
                  p: "3px",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: isPlaceholder ? "20%" : `${heightPct}%`,
                    minHeight: 4,
                    bgcolor: barColor,
                    borderRadius: "3px",
                    transition: "height 300ms ease",
                  }}
                />
              </Box>
            );

            return isPlaceholder ? (
              <Box
                key={index}
                sx={{ flex: 1, height: "100%" }}
              >
                {barContent}
              </Box>
            ) : (
              <HeatmapResponseTimeTooltip key={index} check={check}>
                {barContent}
              </HeatmapResponseTimeTooltip>
            );
          })}
        </Box>

        {/* Status indicators row (bottom) */}
        <Box
          sx={{
            display: "flex",
            gap: gridGap,
            height: STATUS_ROW_HEIGHT,
          }}
        >
          {data.map((check, index) => {
            const isPlaceholder = check.status === "placeholder";
            const statusColor = isPlaceholder
              ? theme.palette.grey[100]
              : check.status === "up"
                ? theme.palette.success.main
                : theme.palette.error.main;

            const indicator = (
              <Box
                sx={{
                  flex: 1,
                  height: "100%",
                  bgcolor: statusColor,
                  borderRadius: "2px",
                }}
              />
            );

            return isPlaceholder ? (
              <Box key={index} sx={{ flex: 1, height: "100%" }}>
                {indicator}
              </Box>
            ) : (
              <HeatmapResponseTimeTooltip key={index} check={check}>
                {indicator}
              </HeatmapResponseTimeTooltip>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};
