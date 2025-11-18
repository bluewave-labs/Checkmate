import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { Select, Checkbox } from "@/components/inputs";

import { useTheme } from "@mui/material/styles";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  UptimeMonitorTypes,
  MonitorStatuses,
  type UptimeMonitorType,
  type MonitorStatus,
} from "@/types/monitor";

const formatValue = (value: string[], fallback: string) => {
  if (value.length === 0) {
    return fallback;
  }
  const capitalized = value.map(
    (item) => item.charAt(0).toUpperCase() + item.slice(1)
  );
  return capitalized.join(" | ");
};

type HeaderFilterProps = {
  selectedTypes: UptimeMonitorType[];
  selectedStatuses: MonitorStatus[];
  onTypesChange: (types: UptimeMonitorType[]) => void;
  onStatusesChange: (statuses: MonitorStatus[]) => void;
};

const coerceValue = <T extends string>(value: string | string[]): T[] => {
  if (typeof value === "string") {
    return value.split(",") as T[];
  }
  return value as T[];
};

export const HeaderFilter = ({
  selectedTypes,
  selectedStatuses,
  onTypesChange,
  onStatusesChange,
}: HeaderFilterProps) => {
  const theme = useTheme();

  const handleTypeChange = (event: SelectChangeEvent<UptimeMonitorType[]>) => {
    onTypesChange(coerceValue<UptimeMonitorType>(event.target.value));
  };

  const handleStatusChange = (event: SelectChangeEvent<MonitorStatus[]>) => {
    onStatusesChange(coerceValue<MonitorStatus>(event.target.value));
  };

  return (
    <Stack spacing={theme.spacing(4)} direction={{ xs: "column", sm: "row" }}>
      <Select
        fieldLabel="Monitor type"
        multiple
        value={selectedTypes}
        onChange={handleTypeChange}
        renderValue={(selected) => (
          <Typography>{formatValue(selected, "All Monitor Types")}</Typography>
        )}
      >
        {UptimeMonitorTypes.map((type) => (
          <MenuItem key={type} value={type}>
            <Checkbox checked={selectedTypes.includes(type)} />
            <Typography textTransform={"capitalize"}>{type}</Typography>
          </MenuItem>
        ))}
      </Select>
      <Select
        fieldLabel="Monitor status"
        multiple
        value={selectedStatuses}
        onChange={handleStatusChange}
        renderValue={(selected) => (
          <Typography>
            {formatValue(selected, "All Monitor Statuses")}
          </Typography>
        )}
      >
        {MonitorStatuses.map((status) => (
          <MenuItem key={status} value={status}>
            <Checkbox checked={selectedStatuses.includes(status)} />
            <Typography textTransform={"capitalize"}>{status}</Typography>
          </MenuItem>
        ))}
      </Select>
    </Stack>
  );
};

export default HeaderFilter;
