import Stack from "@mui/material/Stack";
import { StatusHeader } from "@/components/status-pages/StatusHeader";
import { StatusPageRow } from "@/components/status-pages/StatusPageRow";
import { BasePage } from "@/components/design-elements";

import { useTheme } from "@mui/material/styles";
import type { IMonitor } from "@/types/monitor";
import { useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import { useParams } from "react-router";
import type { IStatusPageWithMonitors } from "@/types/status-page";
import { NameHeader } from "@/components/status-pages/NameHeader";
const GLOBAL_REFRESH = import.meta.env.VITE_APP_GLOBAL_REFRESH;
const StatusPages = () => {
  const theme = useTheme();
  const { id } = useParams();
  const { response } = useGet<ApiResponse<IStatusPageWithMonitors>>(
    `/status-pages/${id}`,
    {},
    { refreshInterval: GLOBAL_REFRESH, keepPreviousData: true }
  );
  const statusPage = response?.data;
  const monitors: IMonitor[] = statusPage?.monitors || [];

  if (!statusPage) {
    return null;
  }

  return (
    <BasePage alignItems={"center"}>
      <Stack minWidth={"66vw"} spacing={theme.spacing(8)}>
        <NameHeader statusPage={statusPage} />
        <StatusHeader statusPage={statusPage} />
        {monitors?.map((monitor: IMonitor) => {
          return <StatusPageRow key={monitor?._id} monitor={monitor} />;
        })}
      </Stack>
    </BasePage>
  );
};

export default StatusPages;
