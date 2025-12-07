import { BasePage, StatBox } from "@/components/design-elements";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useParams } from "react-router";
import { useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import type { IIncident } from "@/types/incident";
import { formatDateWithTz } from "@/utils/TimeUtils";
import { useAppSelector } from "@/hooks/AppHooks";
import prettyMilliseconds from "pretty-ms";

const IncidentDetailsPage = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const uiTimezone = useAppSelector((state: any) => state.ui.timezone);

  const { response } = useGet<ApiResponse<IIncident>>(`/incidents/${id}`);
  const incident = response?.data || null;

  if (!incident) {
    return null;
  }

  const startMs = new Date(incident.startedAt).getTime();
  const endMs = incident.endedAt
    ? new Date(incident.endedAt).getTime()
    : Date.now();
  const duration = Math.max(0, endMs - startMs);

  return (
    <BasePage>
      <Stack spacing={theme.spacing(8)}>
        <Typography variant="h4" color="textPrimary">
          Incident Details
        </Typography>

        <Stack direction={{ xs: "column", md: "row" }} gap={theme.spacing(8)}>
          <StatBox
            title="Monitor"
            subtitle={incident.monitorId?.name || "N/A"}
          />
          <StatBox
            title="Start"
            subtitle={formatDateWithTz(
              incident.startedAt,
              "ddd, MMMM D, YYYY, HH:mm A",
              uiTimezone
            )}
          />
          <StatBox
            title="End"
            subtitle={
              incident.endedAt
                ? formatDateWithTz(
                    incident.endedAt,
                    "ddd, MMMM D, YYYY, HH:mm A",
                    uiTimezone
                  )
                : "Ongoing"
            }
          />
        </Stack>

        <Stack spacing={theme.spacing(4)}>
          <Typography variant="h6" color="textPrimary">
            Resolution
          </Typography>
          <Stack
            direction={"column"}
            spacing={theme.spacing(4)}
            sx={{
              p: theme.spacing(4),
              borderRadius: 2,
              bgcolor: incident.resolved
                ? (theme.palette.success.lowContrast as any)
                : (theme.palette.error.lowContrast as any),
            }}
          >
            <Typography variant="body2" color="textPrimary">
              Status: {incident.resolved ? "Resolved" : "Unresolved"}
            </Typography>
            {incident.resolved && (
              <>
                <Typography variant="body2" color="textPrimary">
                  Type: {incident.resolutionType || "N/A"}
                </Typography>
                <Typography variant="body2" color="textPrimary">
                  By: {incident.resolvedBy?.email || "N/A"}
                </Typography>
              </>
            )}
            <Typography variant="body2" color="textPrimary">
              {incident.resolved && incident.endedAt
                ? `Resolved at: ${formatDateWithTz(
                    incident.endedAt,
                    "ddd, MMMM D, YYYY, HH:mm A",
                    uiTimezone
                  )}`
                : `Ongoing since: ${formatDateWithTz(
                    incident.startedAt,
                    "ddd, MMMM D, YYYY, HH:mm A",
                    uiTimezone
                  )}`}
            </Typography>
          </Stack>
          <Typography variant="body2" color="textSecondary">
            Duration:{" "}
            {prettyMilliseconds(duration, { secondsDecimalDigits: 0 })}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Note: {incident.resolutionNote || "N/A"}
          </Typography>
        </Stack>
      </Stack>
    </BasePage>
  );
};

export default IncidentDetailsPage;
