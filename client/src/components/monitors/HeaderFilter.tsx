import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { Select, Checkbox, TextInput } from "@/components/inputs";

import { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  UptimeMonitorTypes,
  MonitorStatuses,
  type UptimeMonitorType,
  type MonitorStatus,
} from "@/types/monitor";

type HeaderFilterProps = {
  selectedTypes: UptimeMonitorType[];
  selectedStatuses: MonitorStatus[];
  onTypesChange: (types: UptimeMonitorType[]) => void;
  onStatusesChange: (statuses: MonitorStatus[]) => void;
  searchString: string;
  onSearchStringChange?: (value: string) => void;
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
  searchString,
  onSearchStringChange,
}: HeaderFilterProps) => {
  const theme = useTheme();
  const [localSearch, setLocalSearch] = useState<string>(searchString);

  useEffect(() => {
    setLocalSearch(searchString);
  }, [searchString]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (localSearch !== searchString) {
        onSearchStringChange?.(localSearch);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [localSearch, onSearchStringChange, searchString]);

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
        placeholder="Monitor type"
        multiple
        value={selectedTypes}
        onChange={handleTypeChange}
      >
        {UptimeMonitorTypes.map((type) => (
          <MenuItem key={type} value={type}>
            <Stack direction={"row"} gap={theme.spacing(2)}>
              <Checkbox checked={selectedTypes.includes(type)} />
              <Typography textTransform={"capitalize"}>{type}</Typography>
            </Stack>
          </MenuItem>
        ))}
      </Select>
      <Select
        fieldLabel="Monitor status"
        placeholder="Monitor status"
        multiple
        value={selectedStatuses}
        onChange={handleStatusChange}
      >
        {MonitorStatuses.map((status) => (
          <MenuItem key={status} value={status}>
            <Stack direction={"row"} gap={theme.spacing(2)}>
              <Checkbox checked={selectedStatuses.includes(status)} />
              <Typography textTransform={"capitalize"}>{status}</Typography>
            </Stack>
          </MenuItem>
        ))}
      </Select>
      <Box flex={1} display={{ xs: "none", md: "inherit" }} />
      <TextInput
        fieldLabel="Search"
        value={localSearch}
        onChange={(event) => {
          setLocalSearch(event.target.value);
        }}
      />
    </Stack>
  );
};

export default HeaderFilter;
