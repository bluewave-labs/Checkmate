import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { StatusLabel, ValueLabel } from "@/components/design-elements";
import { BaseBox } from "@/components/design-elements";

import { useAppSelector } from "@/hooks/AppHooks";
import type { ICheck } from "@/types/check";
import type { MonitorStatus } from "@/types/monitor";
import { formatDateWithTz } from "@/utils/TimeUtils";

type CheckDetailsCardProps = {
  check: ICheck;
};

export const CheckDetailsCard = ({ check }: CheckDetailsCardProps) => {
  const uiTimezone = useAppSelector((state: any) => state.ui.timezone);
  const phases = check?.timings?.phases;
  const phaseKeys = [
    "wait",
    "dns",
    "tcp",
    "tls",
    "request",
    "firstByte",
    "download",
  ] as const;
  const totalMs = phases
    ? phaseKeys.reduce(
        (sum, key) => sum + Math.max(0, Number((phases as any)[key] ?? 0)),
        0
      )
    : Number(check.responseTime ?? 0);

  return (
    <BaseBox p={4} flex={1} height={"100%"}>
      <Stack spacing={2} sx={{ width: "100%" }}>
        <Typography>Check details</Typography>
        <Typography variant="body2">
          {`Total request time: ${check.timings.phases.total} ms`}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={6} sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body1" color="text.secondary">
              Status
            </Typography>
          </Grid>

          <Grid size={6} sx={{ display: "flex", alignItems: "center" }}>
            <Box>
              <StatusLabel status={check.status as MonitorStatus} />
            </Box>
          </Grid>

          <Grid size={6} sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body1" color="text.secondary">
              HTTP Code
            </Typography>
          </Grid>
          <Grid size={6} sx={{ display: "flex", alignItems: "center" }}>
            <Box>
              <ValueLabel
                value={
                  check.httpStatusCode < 300
                    ? "positive"
                    : check.httpStatusCode < 400
                      ? "neutral"
                      : "negative"
                }
                text={String(check.httpStatusCode ?? "-")}
              />
            </Box>
          </Grid>
          <Grid size={6}>
            <Typography variant="body1" color="text.secondary">
              Type
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2">
              {check.metadata?.type || "-"}
            </Typography>
          </Grid>

          <Grid size={6}>
            <Typography variant="body2">{Math.round(totalMs)} ms</Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body1" color="text.secondary">
              Checked At
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2">
              {formatDateWithTz(
                check.createdAt,
                "ddd, MMM D, YYYY, HH:mm A",
                uiTimezone
              )}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body1" color="text.secondary">
              Message
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2">{check.message || "-"}</Typography>
          </Grid>
        </Grid>
      </Stack>
    </BaseBox>
  );
};
