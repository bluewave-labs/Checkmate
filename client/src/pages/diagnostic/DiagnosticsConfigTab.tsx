import { Box, Typography, Paper, Stack, Divider } from "@mui/material";
import { useGet } from "@/hooks/UseApi";

type EnvConfig = {
  NODE_ENV: string;
  DEPLOYMENT_MODE: string;
  LOG_LEVEL: string;
  ORIGIN: string;
  JWT_SECRET: string;
  PORT: number;
  PAGESPEED_API_KEY: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  STRIPE_SECRET: string;
  STRIPE_WEBHOOK_SECRET: string;
};

export default function DiagnosticsConfigTab() {
  const { response, loading, error } = useGet<{
    message: string;
    data: EnvConfig;
  }>("/diagnostic/env");

  const data = response?.data;

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>
        Environment Configuration
      </Typography>
      {loading && <Typography variant="body2">Loading…</Typography>}
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
      {data && (
        <Paper variant="outlined">
          <Stack divider={<Divider />}>
            {Object.entries(data).map(([key, value]) => (
              <Box key={key} px={2} py={1.5} display="flex" gap={2}>
                <Typography sx={{ minWidth: 220 }} color="text.secondary">
                  {key}
                </Typography>
                <Typography sx={{ wordBreak: "break-all" }}>
                  {String(value)}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
