import Grid from "@mui/material/Grid";
import { HistogramInfrastructure } from "@/components/monitors";

import { useTranslation } from "react-i18next";
import type { AggregateCheck } from "@/types/check";
import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const getChartConfigs = (theme: any, checks: AggregateCheck[], t: any) => {
  return [
    {
      title: t("common.charts.infrastructure.memory.title"),
      type: "memory",
      dataKeys: ["memory.usage_percent"],
      strokeColor: theme.palette.primary.main,
      gradientStartColor: theme.palette.primary.main,
      yDomain: [0, 1],
      idx: null,
    },
    {
      title: t("common.charts.infrastructure.cpu.title"),
      type: "cpu",
      dataKeys: ["cpu.used_percent"],
      strokeColor: theme.palette.success.main,
      gradientStartColor: theme.palette.success.main,
      yDomain: [0, 1],
      idx: null,
    },
    {
      title: t("common.charts.infrastructure.temp.title"),
      type: "temp",
      dataKeys: ["avg_temp"],
      strokeColor: theme.palette.error.main,
      gradientStartColor: theme.palette.error.main,
      yDomain: [0, 150],
      idx: null,
    },
    ...(checks[0]?.disk?.map((_, idx) => ({
      title: t("common.charts.infrastructure.disk.title", { idx }),
      type: "disk",
      dataKeys: [`disk[${idx}].usage_percent`],
      strokeColor: theme.palette.warning.main,
      gradientStartColor: theme.palette.warning.main,
      yDomain: [0, 1],
      idx,
    })) || []),
  ];
};

export const InfraDetailsGraphs = ({
  checks,
  range,
}: {
  checks: AggregateCheck[];
  range: string;
}) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const { t } = useTranslation();
  const chartConfigs = useMemo(
    () => getChartConfigs(theme, checks, t),
    [theme, checks, t]
  );
  return (
    <Grid container spacing={theme.spacing(8)}>
      {chartConfigs.map((config) => {
        return (
          <Grid
            size={isSmall ? 12 : 6}
            key={`${config.type}-${config.idx ?? ""}`}
          >
            <HistogramInfrastructure
              range={range}
              title={config.title}
              type={config.type}
              idx={config.idx}
              key={`${config.type}-${config.idx ?? ""}`}
              checks={checks}
              xKey="bucketDate"
              yDomain={config.yDomain}
              dataKeys={config.dataKeys}
              gradient={true}
              gradientStartColor={config.gradientStartColor}
              gradientEndColor="#ffffff"
              strokeColor={config.strokeColor}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};
