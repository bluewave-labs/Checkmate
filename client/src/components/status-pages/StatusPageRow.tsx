import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { HeatmapResponseTime } from "../common/HeatmapResponseTime";
import { StatusLabel } from "@/components/design-elements";

import type { IMonitor } from "@/types/monitor";

export const StatusPageRow = ({ monitor }: { monitor: IMonitor }) => {
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
        <StatusLabel status={monitor?.status} />
      </Grid>
      <Grid size={12}>
        <HeatmapResponseTime checks={monitor?.latestChecks} />
      </Grid>
    </Grid>
  );
};
