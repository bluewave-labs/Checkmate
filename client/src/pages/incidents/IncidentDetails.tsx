import { BasePage, StatBox } from "@/components/design-elements";
import ResolutionCard from "@/components/design-elements/ResolutionCard";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useNavigate, useParams } from "react-router";
import { useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import type { IIncident } from "@/types/incident";
import { formatDateWithTz } from "@/utils/TimeUtils";
import { useAppSelector } from "@/hooks/AppHooks";
import prettyMilliseconds from "pretty-ms";
import { getMonitorPath } from "@/utils/MonitorUtils";
import type { MonitorType } from "@/types/monitor";

const IncidentDetailsPage = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const uiTimezone = useAppSelector((state: any) => state.ui.timezone);
  const navigate = useNavigate();

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
            onClick={() => {
              const type = incident.monitorId.type as MonitorType;
              const path = getMonitorPath(type);
              const id = (incident.monitorId as any)?._id;
              if (id) navigate(`/${path}/${id}`);
            }}
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

        <ResolutionCard
          resolved={incident.resolved}
          type={incident.resolutionType}
          by={incident.resolvedBy?.email}
          note={incident.resolutionNote}
          timestampLabel={
            incident.resolved && incident.endedAt
              ? `Resolved at: ${formatDateWithTz(
                  incident.endedAt,
                  "ddd, MMMM D, YYYY, HH:mm A",
                  uiTimezone
                )}`
              : `Ongoing since: ${formatDateWithTz(
                  incident.startedAt,
                  "ddd, MMMM D, YYYY, HH:mm A",
                  uiTimezone
                )}`
          }
          durationLabel={`Duration: ${prettyMilliseconds(duration, { secondsDecimalDigits: 0 })}`}
        />
      </Stack>
    </BasePage>
  );
};

export default IncidentDetailsPage;
