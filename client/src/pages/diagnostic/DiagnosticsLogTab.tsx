import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Select } from "@/components/inputs";
import MenuItem from "@mui/material/MenuItem";
import { Table } from "@/components/design-elements";
import type { Header } from "@/components/design-elements/Table";
import { DiagnosticLogDetails } from "@/pages/diagnostic/DiagnosticLogDetails";

import { useState } from "react";
import { useGet } from "@/hooks/UseApi";
import { useTheme } from "@mui/material/styles";
import type { ILogEntry } from "@/types/log";
import type { ApiResponse } from "@/hooks/UseApi";

export const DiagnosticsLogTab = () => {
  const theme = useTheme();
  const [logLevel, setLogLevel] = useState("all");
  const { response } = useGet<ApiResponse<ILogEntry[]>>(
    `/diagnostic/logs`,
    {},
    { refreshInterval: 5000 }
  );

  const logEntries = response?.data || [];

  const levelColors = {
    info: theme.palette.success.main,
    warn: theme.palette.warning.main,
    error: theme.palette.error.main,
    debug: theme.palette.accent.main,
  };

  const headers: Header<ILogEntry>[] = [
    {
      id: "timestamp",
      content: "Timestamp",
      render: (log: ILogEntry) => log.timestamp,
    },
    {
      id: "level",
      content: "Level",
      render: (log: ILogEntry) => {
        const color =
          levelColors[log.level] || theme.palette.primary.contrastText;
        return (
          <span
            style={{ color, fontWeight: "bold", textTransform: "uppercase" }}
          >
            {log.level}
          </span>
        );
      },
    },
    {
      id: "service",
      content: "Service",
      render: (log: ILogEntry) => log.service,
    },
    {
      id: "message",
      content: "Message",
      render: (log: ILogEntry) => log.message,
    },
  ];

  const filteredLogEntries = logEntries
    .filter((log: ILogEntry) => {
      if (logLevel === "all") return true;
      return log.level === logLevel;
    })
    .map((log, idx) => ({ ...log, id: `${log.timestamp}-${idx}` }));

  return (
    <Stack spacing={theme.spacing(4)}>
      <Stack direction="row" spacing={theme.spacing(4)} alignItems={"center"}>
        <Typography variant="h2">Log level: </Typography>
        <Select
          value={logLevel}
          onChange={(e) => {
            setLogLevel(e.target.value);
          }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="error">Error</MenuItem>
          <MenuItem value="warn">Warn</MenuItem>
          <MenuItem value="info">Info</MenuItem>
          <MenuItem value="debug">Debug</MenuItem>
        </Select>
      </Stack>

      <Table
        headers={headers}
        data={filteredLogEntries}
        expandableRows={true}
        renderExpandedContent={(row) => {
          if (!row.stack) return null;
          return <DiagnosticLogDetails logEntry={row} />;
        }}
        cardsOnSmallScreens={true}
      />
    </Stack>
  );
};
