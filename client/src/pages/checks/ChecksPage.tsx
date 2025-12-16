import { BasePage, InfoBox } from "@/components/design-elements";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import { Select } from "@/components/inputs";
import { HeaderRange } from "@/components/common/HeaderRange";
import { ChecksTable } from "@/pages/checks/ChecksTable";
import { LoadingSpinner } from "@/components/design-elements";

import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import type { IMonitor } from "@/types/monitor";
import type { ICheck } from "@/types/check";
import { config } from "@/config/index";

const ChecksPage = () => {
  const theme = useTheme();
  const [selectedMonitorId, setSelectedMonitorId] = useState<string>("all");
  const [range, setRange] = useState("2h");
  const [status, setStatus] = useState<"up" | "down">("down");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const {
    response: monitorResponse,
    loading: monitorsLoading,
    isValidating: monitorsValidating,
  } = useGet<ApiResponse<IMonitor[]>>(
    `/monitors`,
    {},
    { keepPreviousData: true }
  );
  const monitors: IMonitor[] = monitorResponse?.data || [];

  const {
    response: checksResponse,
    loading: checksLoading,
    isValidating: checksValidating,
  } = useGet<ApiResponse<{ count: number; checks: ICheck[] }>>(
    `/checks?page=${page}&rowsPerPage=${rowsPerPage}&range=${range}&status=${status}${
      selectedMonitorId !== "all" ? `&monitorId=${selectedMonitorId}` : ""
    }`,
    {},
    {
      keepPreviousData: true,
      refreshInterval: config.GLOBAL_REFRESH,
      dedupingInterval: 0,
    },
    { useTeamIdAsKey: true }
  );

  const checks = checksResponse?.data?.checks || [];
  const checksCount = checksResponse?.data?.count || 0;

  return (
    <BasePage>
      <InfoBox
        title="Checks"
        description="Browse recent checks across your monitors and filter by monitor and time range."
      />
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={theme.spacing(8)}
        justifyContent={"space-between"}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={theme.spacing(8)}
        >
          <Select<string>
            onChange={(e: SelectChangeEvent<string>) => {
              setSelectedMonitorId(e.target.value);
            }}
            value={selectedMonitorId}
          >
            <MenuItem value="all">All monitors</MenuItem>
            {monitors.map((monitor) => (
              <MenuItem key={monitor._id} value={monitor._id}>
                {monitor.name}
              </MenuItem>
            ))}
          </Select>
          <Select<string>
            onChange={(e: SelectChangeEvent<string>) => {
              const val = e.target.value as "up" | "down";
              setStatus(val);
            }}
            value={status}
          >
            <MenuItem value="up">Up</MenuItem>
            <MenuItem value="down">Down</MenuItem>
          </Select>
          <LoadingSpinner
            show={monitorsValidating || checksValidating}
            sx={{ alignSelf: "center" }}
          />
        </Stack>
        <HeaderRange
          range={range}
          setRange={setRange}
          loading={monitorsLoading || checksLoading}
        />
      </Stack>
      <ChecksTable
        checks={checks}
        count={checksCount}
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
      />
    </BasePage>
  );
};

export default ChecksPage;
