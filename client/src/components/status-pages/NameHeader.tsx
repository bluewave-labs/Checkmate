import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { ExternalLink } from "lucide-react";

import type { IStatusPageWithMonitors } from "@/types/status-page";
import { useTheme } from "@mui/material/styles";
const HOST = import.meta.env.VITE_APP_HOST;

export const NameHeader = ({
  statusPage,
}: {
  statusPage: IStatusPageWithMonitors;
}) => {
  const theme = useTheme();
  return (
    <Stack direction={"row"} alignItems={"flex-end"} spacing={theme.spacing(4)}>
      <Typography variant="h1">{statusPage?.name}</Typography>
      {statusPage?.isPublished && (
        <Stack
          component={"a"}
          href={`${HOST}/status-pages/public/${statusPage?.url}`}
          target="_blank"
          rel="noopener noreferrer"
          direction={"row"}
          sx={{ textDecoration: "none", color: "inherit" }}
        >
          <Typography>Public link</Typography>
          <ExternalLink size={16} strokeWidth={1.5} />
        </Stack>
      )}
    </Stack>
  );
};
