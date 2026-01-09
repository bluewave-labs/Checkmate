import Box from "@mui/material/Box";
import { useTheme, alpha } from "@mui/material/styles";

export type MonitorType = "http" | "https" | "ping" | "tcp" | "smtp" | "dns" | "udp" | "docker" | string;

interface TypeChipProps {
  type: MonitorType;
}

const typeColors: Record<string, string> = {
  http: "primary",
  https: "success",
  ping: "info",
  tcp: "warning",
  smtp: "error",
  dns: "primary",
  udp: "info",
  docker: "warning",
};

export const TypeChip = ({ type }: TypeChipProps) => {
  const theme = useTheme();
  const normalizedType = type.toLowerCase();
  const paletteKey = typeColors[normalizedType] || "primary";
  const color = theme.palette[paletteKey as keyof typeof theme.palette] as { main: string };

  return (
    <Box
      sx={{
        display: "inline-flex",
        px: 3,
        py: 1,
        bgcolor: alpha(color.main, 0.1),
        color: color.main,
        borderRadius: "4px",
        fontSize: 12,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {type.toUpperCase()}
    </Box>
  );
};
