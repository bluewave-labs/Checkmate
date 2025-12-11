import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { BarChart3 } from "lucide-react";
import { BaseChart } from "@/components/monitors/Chart";
import Typography from "@mui/material/Typography";

import { useTranslation } from "react-i18next";
import { getPageSpeedPalette } from "@/utils/MonitorUtils";
import { useTheme } from "@mui/material/styles";

const MetricBox = ({
  label,
  value,
  weight,
}: {
  label: string;
  value: number;
  weight: number;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const palette = getPageSpeedPalette(value);
  return (
    <Stack
      direction={"row"}
      sx={{
        border: 1,
        borderStyle: "solid",
        borderColor: theme.palette.divider,
        borderRadius: theme.shape.borderRadius,
      }}
    >
      <Stack flex={1} p={theme.spacing(4)}>
        <Typography textTransform={"uppercase"}>{label}</Typography>
        <Stack direction="row" justifyContent={"space-between"}>
          <Typography>{`${value}%`}</Typography>
          <Typography>{`${t("common.charts.pageSpeed.weight")}: ${weight}%`}</Typography>
        </Stack>
      </Stack>
      <Box
        width={4}
        bgcolor={theme.palette[palette].light}
        sx={{
          borderTopRightRadius: theme.shape.borderRadius,
          borderBottomRightRadius: theme.shape.borderRadius,
        }}
      />
    </Stack>
  );
};

export const ChartPageSpeedReportLegend = ({
  latestCheck,
}: {
  latestCheck: any;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <BaseChart
      icon={<BarChart3 size={20} strokeWidth={1.5} />}
      title="PageSpeed report"
    >
      <Stack gap={theme.spacing(4)}>
        <MetricBox
          label={t("common.charts.pageSpeed.si")}
          value={Math.floor(latestCheck?.si * 100 || 0 * 100)}
          weight={10}
        />
        <MetricBox
          label={t("common.charts.pageSpeed.fcp")}
          value={Math.floor(latestCheck?.fcp * 100 || 0 * 100)}
          weight={10}
        />
        <MetricBox
          label={t("common.charts.pageSpeed.cls")}
          value={Math.floor(latestCheck?.cls * 100 || 0 * 100)}
          weight={25}
        />
        <MetricBox
          label={t("common.charts.pageSpeed.tbt")}
          value={Math.floor(latestCheck?.tbt * 100 || 0 * 100)}
          weight={30}
        />
        <MetricBox
          label={t("common.charts.pageSpeed.lcp")}
          value={Math.floor(latestCheck?.lcp * 100 || 0 * 100)}
          weight={25}
        />
      </Stack>
    </BaseChart>
  );
};
