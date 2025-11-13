import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useTheme, alpha } from "@mui/material/styles";
import type { ILogEntry } from "@/types/log";

export const DiagnosticLogDetails = ({ logEntry }: { logEntry: ILogEntry }) => {
  const theme = useTheme();

  return (
    <Stack
      bgcolor={alpha(theme.palette.error.main, 0.1)}
      sx={{
        p: theme.spacing(4),
      }}
    >
      <Typography variant="h2" textTransform={"capitalize"}>
        {"Stack trace"}
      </Typography>
      <Typography sx={{ wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
        {logEntry.stack}{" "}
      </Typography>
    </Stack>
  );
};
