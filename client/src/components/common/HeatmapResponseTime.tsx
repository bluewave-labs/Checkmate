import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import type { ICheck } from "@/types/check";
import { getResponseColor } from "@/utils/DataUtils";
import { HistogramResponseTimeTooltip } from "@/components/monitors/HistogramResponseTimeTooltip";

interface HeatmapResponseTimeProps {
  checks: ICheck[];
}

export const HeatmapResponseTime = ({ checks }: HeatmapResponseTimeProps) => {
  const theme = useTheme();

  if (!checks || checks.length === 0) return null;
  let data = Array<any>();

  if (!checks || checks.length === 0) {
    checks = [];
  }
  if (checks.length !== 25) {
    const placeholders = Array(25 - checks.length).fill({
      status: "placeholder",
    });
    data = [...checks, ...placeholders];
  } else {
    data = checks;
  }
  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(25, 1fr)",
          gap: theme.spacing(0.5),
          alignItems: "stretch",
        }}
      >
        {data.map((check, index) => {
          const statusBg =
            check.status === "placeholder"
              ? theme.palette.primary.lowContrast
              : check.status === "up"
                ? theme.palette.success.lowContrast
                : theme.palette.error.lowContrast;
          const respBg =
            check.status === "placeholder"
              ? theme.palette.primary.lowContrast
              : getResponseColor(check.responseTime, {
                  start: theme.palette.success.lowContrast,
                  mid: theme.palette.warning.lowContrast,
                  end: theme.palette.error.lowContrast,
                });

          return (
            <HistogramResponseTimeTooltip
              key={`${check}-${index}`}
              check={check}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateRows: "auto auto",
                  gap: theme.spacing(0.5),
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: theme.spacing(0.75),
                    borderRadius: theme.spacing(0.5),
                    bgcolor: statusBg,
                  }}
                />
                <Box
                  sx={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: theme.spacing(0.5),
                    bgcolor: respBg,
                  }}
                />
              </Box>
            </HistogramResponseTimeTooltip>
          );
        })}
      </Box>
    </Box>
  );
};
