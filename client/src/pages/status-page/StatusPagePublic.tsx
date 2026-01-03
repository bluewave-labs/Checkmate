import Stack from "@mui/material/Stack";
import { StatusHeader } from "@/components/status-pages/StatusHeader";
import { StatusPageRow } from "@/components/status-pages/StatusPageRow";
import { BasePage } from "@/components/design-elements";

import { useTheme } from "@mui/material/styles";
import { useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import { useParams } from "react-router";
import type { IStatusPageWithChecksMap } from "@/types/status-page";
import { NameHeader } from "@/components/status-pages/NameHeader";
import { config } from "@/config/index";

const GLOBAL_REFRESH = config.GLOBAL_REFRESH;
const StatusPages = () => {
  const theme = useTheme();
  const { url } = useParams();
  const { response } = useGet<ApiResponse<IStatusPageWithChecksMap>>(
    `/status-pages/public/${url}`,
    {},
    { refreshInterval: GLOBAL_REFRESH, keepPreviousData: true }
  );
  const statusPage = response?.data?.statusPage;
  const monitors = statusPage?.monitors || [];
  const checksMap: Record<string, any[]> = response?.data?.checksMap || {};

  if (!statusPage) {
    return null;
  }

  return (
    <BasePage alignItems={"center"} paddingTop={theme.spacing(20)}>
      <Stack minWidth={"66vw"} spacing={theme.spacing(8)}>
        <NameHeader statusPage={statusPage} />
        <StatusHeader statusPage={statusPage} />
        {monitors?.map((monitor: any) => {
          const checks = checksMap?.[monitor?._id as any] || [];

          return (
            <StatusPageRow
              key={monitor?.id}
              monitor={monitor}
              checks={checks}
            />
          );
        })}
      </Stack>
    </BasePage>
  );
};

export default StatusPages;
