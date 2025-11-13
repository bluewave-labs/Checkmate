import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import { HistogramInfrastructure } from "@/components/monitors";
import { Select } from "@/components/inputs";

import type { IInfraCheck } from "@/types/check";
import { useMemo, useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const getChartConfigs = (
  theme: any,
  checks: IInfraCheck[],
  selectedInterface: string
) => {
  const idx = checks[0]?.net.findIndex((i) => i.name === selectedInterface);
  if (idx === -1) return [];
  return [
    {
      type: "Bytes received",
      dataKeys: [`net[${idx}].bytes_recv`],
      strokeColor: theme.palette.accent.main,
      gradientStartColor: theme.palette.accent.main,
      yDomain: [0, 1],
      idx: null,
    },
    {
      type: "Bytes sent",
      dataKeys: [`net[${idx}].bytes_sent`],
      strokeColor: theme.palette.success.main,
      gradientStartColor: theme.palette.success.main,
      yDomain: [0, 1],
      idx: null,
    },
    {
      type: "Packets received",
      dataKeys: [`net[${idx}].packets_recv`],
      strokeColor: theme.palette.warning.main,
      gradientStartColor: theme.palette.warning.main,
      yDomain: [0, 1],
      idx: null,
    },
    {
      type: "Packets sent",
      dataKeys: [`net[${idx}].packets_sent`],
      strokeColor: theme.palette.error.main,
      gradientStartColor: theme.palette.error.main,
      yDomain: [0, 1],
      idx: null,
    },
  ];
};

export const InfraDetailsNetGraphs = ({
  checks,
  range,
}: {
  checks: IInfraCheck[];
  range: string;
}) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const [selectedInterface, setSelectedInterface] = useState<string>("");
  const chartConfigs = useMemo(
    () => getChartConfigs(theme, checks, selectedInterface),
    [theme, checks, selectedInterface]
  );

  useEffect(() => {
    if (checks[0]) {
      const firstNonLoopback = checks[0].net.find(
        (iface) => iface.name !== "lo"
      );
      setSelectedInterface(firstNonLoopback?.name || "");
    }
  }, [checks]);
  return (
    <Stack gap={theme.spacing(8)}>
      <Grid container spacing={theme.spacing(8)}>
        <Grid size={4}>
          <Select
            fullWidth
            value={selectedInterface}
            onChange={(e) => setSelectedInterface(e.target.value)}
          >
            {checks[0]?.net.map((iface) => {
              return (
                <MenuItem key={iface.name} value={iface.name}>
                  {iface.name}
                </MenuItem>
              );
            })}
          </Select>
        </Grid>
        <Grid size={8} />

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
    </Stack>
  );
};
