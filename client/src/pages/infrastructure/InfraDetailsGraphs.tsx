import Grid from "@mui/material/Grid";
import { HistogramInfrastructure } from "@/components/monitors";

import type { IInfraCheck } from "@/types/check";
import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const getChartConfigs = (theme: any, checks: IInfraCheck[]) => {
  return [
    {
      type: "memory",
      dataKeys: ["memory.usage_percent"],
      strokeColor: theme.palette.accent.main,
      gradientStartColor: theme.palette.accent.main,
      yDomain: [0, 1],
      idx: null,
    },
    {
      type: "cpu",
      dataKeys: ["cpu.used_percent"],
      strokeColor: theme.palette.success.main,
      gradientStartColor: theme.palette.success.main,
      yDomain: [0, 1],
      idx: null,
    },
    {
      type: "temp",
      dataKeys: ["avg_temp"],
      strokeColor: theme.palette.error.main,
      gradientStartColor: theme.palette.error.main,
      yDomain: [0, 150],
      idx: null,
    },
    ...(checks[0]?.disk?.map((_, idx) => ({
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
  checks: IInfraCheck[];
  range: string;
}) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const chartConfigs = useMemo(
    () => getChartConfigs(theme, checks),
    [theme, checks]
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
              title={config.type}
              idx={config.idx}
              key={`${config.type}-${config.idx ?? ""}`}
              checks={checks}
              xKey="_id"
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
