import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import type { ResponsiveStyleValue } from "@mui/system";
import type { ICheck } from "@/types/check";
import { normalizeResponseTimes } from "@/utils/DataUtils";
import { HeatmapResponseTimeTooltip } from "./HeatmapResponseTimeTooltip";

interface HistogramResponseTimeProps {
  checks: ICheck[];
  height?: ResponsiveStyleValue<number | string>;
  gap?: ResponsiveStyleValue<number | string>;
}

const DEFAULT_HEIGHT = 50;

export const HistogramResponseTime = ({
  checks,
  height = DEFAULT_HEIGHT,
  gap,
}: HistogramResponseTimeProps) => {
  const theme = useTheme();

  if (!Array.isArray(checks) || checks.length === 0) return null;

  const normalized = normalizeResponseTimes(checks.slice(-25), "responseTime");
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

  const chartHeight = typeof height === "number" ? `${height}px` : height;
  const gridGap = gap ?? theme.spacing(0.5);

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(25, 1fr)",
          gap: gridGap,
          alignItems: "end",
          height: chartHeight,
        }}
      >
        {data.map((check, index) => {
          const isPlaceholder = (check as any).status === "placeholder";
          const heightPct = `${Math.max(0, Math.min(100, (check as any).normalResponseTime ?? 0))}%`;
          const barColor =
            check.status === "up"
              ? theme.palette.success.lowContrast
              : theme.palette.error.lowContrast;
          const bar = (
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: theme.spacing(1),
                bgcolor: theme.palette.primary.lowContrast,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: isPlaceholder ? 0 : heightPct,
                  bgcolor: barColor,
                  transition: "height 500ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </Box>
          );

          return isPlaceholder ? (
            <Box key={index} sx={{ height: "100%" }}>
              {bar}
            </Box>
          ) : (
            <HeatmapResponseTimeTooltip key={index} check={check}>
              {bar}
            </HeatmapResponseTimeTooltip>
          );
        })}
      </Box>
    </Box>
  );
};
