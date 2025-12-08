import Box from "@mui/material/Box";
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
              ? theme.palette.action.hover
              : check.status === "up"
                ? theme.palette.success.light
                : theme.palette.error.light;
          const respBg =
            check.status === "placeholder"
              ? theme.palette.action.hover
              : getResponseColor(check.responseTime, {
                  start: theme.palette.success.main,
                  mid: theme.palette.warning.main,
                  end: theme.palette.error.main,
                });
          const statusBorder =
            check.status === "placeholder"
              ? theme.palette.divider
              : check.status === "up"
                ? theme.palette.success.main
                : theme.palette.error.main;

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
                      position: "relative",
                      width: "100%",
                      aspectRatio: "10",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        bgcolor: statusBg,
                        borderRadius: theme.spacing(0.5),
                        ...availabilityCellSx,
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        borderRadius: theme.spacing(0.5),
                        boxShadow: `inset 0 0 0 2px ${statusBorder}`,
                      }}
                    />
                  </Box>
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
