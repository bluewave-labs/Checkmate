import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { HistogramStatusPage } from "./HistogramStatusPage";
import { StatusLabel } from "@/components/design-elements";

import type { IMonitor } from "@/types/monitor";
import { useTheme } from "@mui/material/styles";

export const StatusPageRow = ({ monitor }: { monitor: IMonitor }) => {
  const theme = useTheme();
  return (
    <Grid container>
      <Grid size={12}>
        <Typography>{monitor?.name}</Typography>
      </Grid>
      <Grid size={{ xs: 8, sm: 10 }}>
        <HistogramStatusPage checks={monitor?.latestChecks} />
      </Grid>
      <Grid
        size={{ xs: 4, sm: 2 }}
        paddingLeft={theme.spacing(10)}
        display={"flex"}
        alignItems={"center"}
        justifyContent={"flex-start"}
      >
        <StatusLabel status={monitor?.status} />
      </Grid>
    </Grid>
  );
};
