import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { ExternalLink } from "lucide-react";
import Link from "@mui/material/Link";
import { config } from "@/config/index";

import type { IStatusPageWithMonitors } from "@/types/status-page";
const HOST = config.HOST;

export const NameHeader = ({
  statusPage,
}: {
  statusPage: IStatusPageWithMonitors;
}) => {
  return (
    <Stack direction={"row"} alignItems={"flex-end"} spacing={4}>
      <Typography variant="h1">{statusPage?.name}</Typography>
      {statusPage?.isPublished && (
        <Link
          href={`${HOST ?? ""}/status-pages/public/${statusPage?.url}`}
          target="_blank"
          rel="noopener noreferrer"
          underline="none"
          color="inherit"
          sx={{ display: "inline-flex" }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography>Public link</Typography>
            <ExternalLink size={16} strokeWidth={1.5} />
          </Stack>
        </Link>
      )}
    </Stack>
  );
};
