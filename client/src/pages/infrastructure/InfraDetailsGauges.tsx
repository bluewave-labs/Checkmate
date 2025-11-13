import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BaseChart } from "@/components/monitors/Chart";
import { Gauge } from "@/components/design-elements";

import { getGbs, getFrequency } from "./InfraUtils";
import type { IInfraCheck } from "@/types/check";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

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

export const InfraDetailsGauges = ({ checks }: { checks: IInfraCheck[] }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  return (
    <Stack
      direction={isSmall ? "column" : "row"}
      spacing={theme.spacing(8)}
      alignItems={"center"}
    >
      <InfraDetailGauge
        title="Memory Usage"
        progress={(checks[0]?.memory.usage_percent || 0) * 100}
        upperLabel="Used"
        upperValue={getGbs(checks[0]?.memory.used_bytes)}
        lowerLabel="Free"
        lowerValue={getGbs(checks[0]?.memory.total_bytes)}
      />
      <InfraDetailGauge
        title="CPU Usage"
        progress={(checks[0]?.cpu.usage_percent || 0) * 100}
        upperLabel="Current frequency"
        upperValue={getFrequency(checks[0]?.cpu.current_frequency)}
        lowerLabel="Max Frequency"
        lowerValue={getFrequency(checks[0]?.cpu.frequency)}
      />
      {checks[0]?.disk?.map((disk, idx) => {
        return (
          <InfraDetailGauge
            key={disk.device + idx}
            title={`Disk ${idx} usage`}
            progress={(disk.usage_percent || 0) * 100}
            upperLabel="Used"
            upperValue={getGbs(disk.used_bytes)}
            lowerLabel="Free"
            lowerValue={getGbs(disk.total_bytes)}
          />
        );
      })}
    </Stack>
  );
};
