import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

import { getStatusPageHeaderConfig } from "@/utils/MonitorUtils";
import type { IStatusPageWithMonitors } from "@/types/status-page";
import { useTheme } from "@mui/material/styles";

export const StatusHeader = ({
  statusPage,
}: {
  statusPage: IStatusPageWithMonitors;
}) => {
  const theme = useTheme();
  const headerConfig = getStatusPageHeaderConfig(statusPage?.monitors || []);

  return (
    <Stack
      width={"100%"}
      bgcolor={theme.palette[headerConfig.paletteKey].lowContrast}
      borderRadius={theme.shape.borderRadius}
      padding={theme.spacing(4)}
    >
      <Typography variant="h2" alignSelf={"center"}>
        {headerConfig.message}
      </Typography>
    </Stack>
  );
};
