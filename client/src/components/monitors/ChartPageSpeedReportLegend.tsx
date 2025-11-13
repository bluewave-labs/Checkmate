import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { BarChart3 } from "lucide-react";
import { BaseChart } from "@/components/monitors/Chart";
import Typography from "@mui/material/Typography";

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
  const theme = useTheme();
  const palette = getPageSpeedPalette(value);
  return (
    <Stack
      direction={"row"}
      sx={{
        border: 1,
        borderStyle: "solid",
        borderColor: theme.palette.primary.lowContrast,
        borderRadius: theme.shape.borderRadius,
      }}
    >
      <Stack flex={1} p={theme.spacing(4)}>
        <Typography textTransform={"uppercase"}>{label}</Typography>
        <Stack direction="row" justifyContent={"space-between"}>
          <Typography>{`${value}%`}</Typography>
          <Typography>{`Weight: ${weight}%`}</Typography>
        </Stack>
      </Stack>
      <Box
        width={4}
        bgcolor={theme.palette[palette].lowContrast}
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
  return (
    <BaseChart icon={<BarChart3 size={20} strokeWidth={1.5} />} title="PageSpeed report">
      <Stack gap={theme.spacing(4)}>
        <MetricBox
          label="Speed index (SI)"
          value={Math.floor(latestCheck?.si * 100 || 0 * 100)}
          weight={10}
        />
        <MetricBox
          label="First contentful paint (FCP)"
          value={Math.floor(latestCheck?.fcp * 100 || 0 * 100)}
          weight={10}
        />
        <MetricBox
          label="Cumulative layout shift (CLS)"
          value={Math.floor(latestCheck?.cls * 100 || 0 * 100)}
          weight={25}
        />
        <MetricBox
          label="Total blocking time (TBT)"
          value={Math.floor(latestCheck?.tbt * 100 || 0 * 100)}
          weight={30}
        />
        <MetricBox
          label="Largest contentful paint (LCP)"
          value={Math.floor(latestCheck?.lcp * 100 || 0 * 100)}
          weight={25}
        />
      </Stack>
    </BaseChart>
  );
};
