import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { HeatmapResponseTime } from "../common/HeatmapResponseTime";
import { HistogramResponseTime } from "../common/HistogramResponseTime";
import { StatusLabel } from "@/components/design-elements";

import { useTheme } from "@mui/material/styles";
import { useAppSelector } from "@/hooks/AppHooks";
import type { IMonitor } from "@/types/monitor";

export const StatusPageRow = ({ monitor }: { monitor: IMonitor }) => {
  const theme = useTheme();
  const type = useAppSelector((state) => state?.ui?.chartType || "heatmap");

  return (
    <Grid container>
      <Grid size={6} display={"flex"} alignItems={"center"}>
        <Typography>{monitor?.name}</Typography>
      </Grid>
      <Grid
        size={6}
        display={"flex"}
        alignItems={"center"}
        justifyContent={"flex-end"}
      >
        <StatusLabel status={monitor?.status} sx={{ py: 1 }} />
      </Grid>
      <Grid size={12} marginTop={theme.spacing(2)}>
        {type === "heatmap" && (
          <HeatmapResponseTime
            gap={{ xs: theme.spacing(0.5), md: theme.spacing(2) }}
            checks={monitor?.latestChecks}
            availabilityCellSx={{
              borderRadius: {
                xs: theme.spacing(0.5),
                md: theme.shape.borderRadius,
              },
            }}
            responseCellSx={{
              borderRadius: {
                xs: theme.spacing(0.5),
                md: theme.shape.borderRadius,
              },
            }}
          />
        )}
        {type === "histogram" && (
          <HistogramResponseTime
            checks={monitor?.latestChecks}
            height={{ xs: 50, md: 100 }}
            gap={{ xs: 0.5, md: theme.spacing(4) }}
          />
        )}
      </Grid>
    </Grid>
  );
};
