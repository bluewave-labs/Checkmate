import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router-dom";
import { StatusLabel, ValueLabel } from "@/components/design-elements";
import { BaseBox } from "@/components/design-elements";

import { useAppSelector } from "@/hooks/AppHooks";
import type { ICheck } from "@/types/check";
import type { MonitorStatus } from "@/types/monitor";
import { formatDateWithTz } from "@/utils/TimeUtils";
import { useTheme } from "@mui/material/styles";
import { getMonitorPath } from "@/utils/MonitorUtils";
import { useTranslation } from "react-i18next";

type CheckDetailsCardProps = {
  check: ICheck;
};

export const CheckDetailsCard = ({ check }: CheckDetailsCardProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const uiTimezone = useAppSelector((state: any) => state.ui.timezone);
  const phases = check?.timings?.phases;
  type phaseKeys = [
    "wait",
    "dns",
    "tcp",
    "tls",
    "request",
    "firstByte",
    "download",
    "total",
  ];

  const status =
    (check?.status as MonitorStatus) ?? ("initializing" as MonitorStatus);
  const httpStatusCode = Number(check?.httpStatusCode ?? NaN);
  const httpValue: "positive" | "neutral" | "negative" = Number.isFinite(
    httpStatusCode
  )
    ? httpStatusCode < 300
      ? "positive"
      : httpStatusCode < 400
        ? "neutral"
        : "negative"
    : "neutral";
  const httpText = Number.isFinite(httpStatusCode)
    ? String(httpStatusCode)
    : "-";
  const typeText = check?.metadata?.type ?? "-";
  const checkedAtText = check?.createdAt
    ? formatDateWithTz(check.createdAt, "ddd, MMM D, YYYY, HH:mm A", uiTimezone)
    : "-";
  const messageText = check?.message ?? "-";
  const getPhaseMs = (key: phaseKeys[number]) => {
    const v = Number((phases as any)?.[key] ?? NaN);
    return Number.isFinite(v) ? `${Math.floor(Math.max(0, v))} ms` : "-";
  };

  return (
    <BaseBox p={4} flex={1} height={"100%"}>
      <Stack spacing={8} sx={{ width: "100%" }}>
        <Stack>
          <Typography>{t("checks.details.detailsCard.title")}</Typography>
          <Typography variant="body2">
            {t("checks.details.common.requestTime", {
              time: getPhaseMs("total"),
            })}
          </Typography>
          {(() => {
            const href = `/${getMonitorPath(check.metadata.type)}/${check.metadata.monitorId}`;
            return href ? (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                <Link
                  component={RouterLink}
                  to={href}
                  underline="hover"
                  color="primary"
                >
                  {t("checks.details.detailsCard.linkText")}
                </Link>
              </Typography>
            ) : null;
          })()}
        </Stack>
        {/* Basic info section */}
        <Grid container spacing={2}>
          <Grid
            size={12}
            borderBottom={1}
            borderColor={theme.palette.divider}
            mt={4}
            mb={2}
          >
            <Typography>
              {t("checks.details.detailsCard.headers.basicInfo")}
            </Typography>
          </Grid>
          <Grid size={6} sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body1" color="text.secondary">
              {t("checks.details.detailsCard.fields.status")}
            </Typography>
          </Grid>
          <Grid size={6} sx={{ display: "flex", alignItems: "center" }}>
            <Box>
              <StatusLabel status={status} />
            </Box>
          </Grid>
          <Grid size={6} sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body1" color="text.secondary">
              {t("checks.details.detailsCard.fields.code")}
            </Typography>
          </Grid>
          <Grid size={6} sx={{ display: "flex", alignItems: "center" }}>
            <Box>
              <ValueLabel value={httpValue} text={httpText} />
            </Box>
          </Grid>
          <Grid size={6}>
            <Typography variant="body1" color="text.secondary">
              {t("checks.details.detailsCard.fields.type")}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2">{typeText}</Typography>
          </Grid>

          <Grid size={6}>
            <Typography variant="body1" color="text.secondary">
              {t("checks.details.detailsCard.fields.checkTime")}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2">{checkedAtText}</Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body1" color="text.secondary">
              {t("checks.details.detailsCard.fields.message")}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2">{messageText}</Typography>
          </Grid>
        </Grid>
        {/* Timing phases section */}
        <Grid container spacing={2}>
          <Grid
            size={12}
            borderBottom={1}
            borderColor={theme.palette.divider}
            mb={4}
            mt={2}
          >
            <Typography>
              {t("checks.details.detailsCard.headers.timing")}
            </Typography>
          </Grid>

          <Grid size={6}>
            <Typography variant="body1" color="text.secondary">
              {t("checks.details.detailsCard.fields.wait")}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2">{getPhaseMs("wait")}</Typography>
          </Grid>

          <Grid size={6}>
            <Typography variant="body1" color="text.secondary">
              {t("checks.details.detailsCard.fields.dns")}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2">{getPhaseMs("dns")}</Typography>
          </Grid>

          <Grid size={6}>
            <Typography variant="body1" color="text.secondary">
              {t("checks.details.detailsCard.fields.tcp")}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2">{getPhaseMs("tcp")}</Typography>
          </Grid>

          <Grid size={6}>
            <Typography variant="body1" color="text.secondary">
              {t("checks.details.detailsCard.fields.tls")}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2">{getPhaseMs("tls")}</Typography>
          </Grid>

          <Grid size={6}>
            <Typography variant="body1" color="text.secondary">
              {t("checks.details.detailsCard.fields.request")}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2">{getPhaseMs("request")}</Typography>
          </Grid>

          <Grid size={6}>
            <Typography variant="body1" color="text.secondary">
              {t("checks.details.detailsCard.fields.firstByte")}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2">{getPhaseMs("firstByte")}</Typography>
          </Grid>

          <Grid size={6}>
            <Typography variant="body1" color="text.secondary">
              {t("checks.details.detailsCard.fields.download")}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2">{getPhaseMs("download")}</Typography>
          </Grid>

          <Grid size={6}>
            <Typography variant="body1" color="text.secondary">
              {t("checks.details.detailsCard.fields.total")}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2">{getPhaseMs("total")}</Typography>
          </Grid>
        </Grid>
      </Stack>
    </BaseBox>
  );
};
