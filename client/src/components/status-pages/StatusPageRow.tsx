import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { HeatmapResponseTime } from "../common/HeatmapResponseTime";
import { StatusLabel } from "@/components/design-elements";
import { useTheme } from "@mui/material/styles";

import type { IMonitor } from "@/types/monitor";

export const StatusPageRow = ({ monitor }: { monitor: IMonitor }) => {
  const theme = useTheme();

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
        <HeatmapResponseTime
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
      </Grid>
    </Grid>
  );
};
