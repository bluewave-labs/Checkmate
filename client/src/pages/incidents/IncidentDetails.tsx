import { BasePage, StatBox } from "@/components/design-elements";
import ResolutionCard from "@/components/design-elements/ResolutionCard";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useTheme } from "@mui/material/styles";
import { useNavigate, useParams } from "react-router";
import { useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import type { IncidentWithDetails } from "@/types/incident";
import { formatDateWithTz } from "@/utils/TimeUtils";
import { useAppSelector } from "@/hooks/AppHooks";
import prettyMilliseconds from "pretty-ms";
import { getMonitorPath } from "@/utils/MonitorUtils";
import type { MonitorType } from "@/types/monitor";
import { useTranslation } from "react-i18next";

const IncidentDetailsPage = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const uiTimezone = useAppSelector((state: any) => state.ui.timezone);
  const navigate = useNavigate();

  const { response } = useGet<ApiResponse<IncidentWithDetails>>(
    `/incidents/${id}`
  );
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
          {t("incidents.title")}
        </Typography>

        <Stack direction={{ xs: "column", md: "row" }} gap={theme.spacing(8)}>
          <StatBox
            title={t("monitors.common.stats.monitor")}
            subtitle={incident.monitor?.name || "N/A"}
            onClick={() => {
              const type = incident.monitor.type;
              const path = getMonitorPath(type);
              const id = incident.monitor?.id;
              if (id) navigate(`/${path}/${id}`);
            }}
          />
          <StatBox
            title={t("monitors.common.stats.start")}
            subtitle={formatDateWithTz(
              incident.startedAt,
              "ddd, MMMM D, YYYY, HH:mm A",
              uiTimezone
            )}
          />
          <StatBox
            title={t("monitors.common.stats.end")}
            subtitle={
              incident.endedAt
                ? formatDateWithTz(
                    incident.endedAt,
                    "ddd, MMMM D, YYYY, HH:mm A",
                    uiTimezone
                  )
                : t("monitors.common.stats.ongoing")
            }
          />
        </Stack>

        <ResolutionCard
          resolved={incident.resolved}
          type={incident.resolutionType}
          by={incident.resolvedByUser?.email}
          note={incident.resolutionNote}
          timestampLabel={
            incident.resolved && incident.endedAt
              ? `${t("incidents.details.resolutionCard.resolvedAt")}: ${formatDateWithTz(
                  incident.endedAt,
                  "ddd, MMMM D, YYYY, HH:mm A",
                  uiTimezone
                )}`
              : `${t("incidents.details.resolutionCard.ongoingSince")}: ${formatDateWithTz(
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
