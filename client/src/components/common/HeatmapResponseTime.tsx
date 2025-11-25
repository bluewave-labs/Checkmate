import Box from "@mui/material/Box";
// Using strip + square; icons removed
import { useTheme } from "@mui/material/styles";
import type { ICheck } from "@/types/check";
import { getResponseColor } from "@/utils/DataUtils";
import { HeatmapResponseTimeTooltip } from "./HeatmapResponseTimeTooltip";
import type { SxProps } from "@mui/material/styles";
import type { ResponsiveStyleValue } from "@mui/system";
interface HeatmapResponseTimeProps {
  checks: ICheck[];
  gap?: ResponsiveStyleValue<number | string>;
  availabilityCellSx?: SxProps;
  responseCellSx?: SxProps;
}

export const HeatmapResponseTime = ({
  checks,
  gap,
  availabilityCellSx,
  responseCellSx,
}: HeatmapResponseTimeProps) => {
  const theme = useTheme();

  if (!gap) {
    gap = theme.spacing(0.5);
  }

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
          gap: gap,
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
            <HeatmapResponseTimeTooltip key={`${check}-${index}`} check={check}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateRows: "auto auto",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: theme.spacing(2),
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      aspectRatio: "10",
                      bgcolor: statusBg,
                      borderRadius: theme.spacing(0.5),
                      ...availabilityCellSx,
                    }}
                  />
                  <Box
                    sx={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      bgcolor: respBg,
                      borderRadius: theme.spacing(0.5),
                      ...responseCellSx,
                    }}
                  />
                </Box>
              </Box>
            </HeatmapResponseTimeTooltip>
          );
        })}
      </Box>
    </Box>
  );
};
