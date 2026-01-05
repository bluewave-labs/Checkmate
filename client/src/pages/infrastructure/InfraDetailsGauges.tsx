import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BaseChart } from "@/components/monitors/Chart";
import { Gauge } from "@/components/design-elements";

import { useTranslation } from "react-i18next";
import { getGbs, getFrequency } from "./InfraUtils";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { AggregateCheck } from "@/types/check";

const InfraDetailGauge = ({
  title,
  progress,
  upperLabel,
  upperValue,
  lowerLabel,
  lowerValue,
}: {
  title: string;
  progress: number;
  upperLabel?: string;
  upperValue?: string | number;
  lowerLabel?: string;
  lowerValue?: string | number;
}) => {
  const theme = useTheme();
  return (
    <BaseChart icon={null} title={title} maxWidth={225}>
      <Stack alignItems={"center"} mb={theme.spacing(4)} gap={theme.spacing(4)}>
        <Gauge progress={progress} />
      </Stack>
      <Stack direction={"row"} justifyContent={"space-between"}>
        <Typography>{upperLabel}</Typography>
        <Typography>{upperValue}</Typography>
      </Stack>
      <Stack direction={"row"} justifyContent={"space-between"}>
        <Typography>{lowerLabel}</Typography>
        <Typography>{lowerValue}</Typography>
      </Stack>
    </BaseChart>
  );
};

export const InfraDetailsGauges = ({
  checks,
}: {
  checks: AggregateCheck[];
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  return (
    <Stack
      direction={isSmall ? "column" : "row"}
      spacing={theme.spacing(8)}
      alignItems={"center"}
    >
      <InfraDetailGauge
        title={t("monitors.infrastructure.gauges.memory.title")}
        progress={(checks[0]?.memory?.usage_percent || 0) * 100}
        upperLabel={t("monitors.infrastructure.gauges.memory.upperLabel")}
        upperValue={getGbs(checks[0]?.memory?.used_bytes || 0)}
        lowerLabel={t("monitors.infrastructure.gauges.memory.lowerLabel")}
        lowerValue={getGbs(checks[0]?.memory?.total_bytes || 0)}
      />
      <InfraDetailGauge
        title={t("monitors.infrastructure.gauges.cpu.title")}
        progress={(checks[0]?.cpu?.usage_percent || 0) * 100}
        upperLabel={t("monitors.infrastructure.gauges.cpu.upperLabel")}
        upperValue={getFrequency(checks[0]?.cpu?.current_frequency || 0)}
        lowerLabel={t("monitors.infrastructure.gauges.cpu.lowerLabel")}
        lowerValue={getFrequency(checks[0]?.cpu?.frequency || 0)}
      />
      {checks[0]?.disk?.map((disk, idx) => {
        return (
          <InfraDetailGauge
            key={disk?.device || 0 + idx}
            // title={`Disk ${idx} usage`}
            title={t("monitors.infrastructure.gauges.disk.title", { idx })}
            progress={(disk.usage_percent || 0) * 100}
            upperLabel={t("monitors.infrastructure.gauges.disk.upperLabel")}
            upperValue={getGbs(disk?.used_bytes || 0)}
            lowerLabel={t("monitors.infrastructure.gauges.disk.lowerLabel")}
            lowerValue={getGbs(disk?.total_bytes || 0)}
          />
        );
      })}
    </Stack>
  );
};
