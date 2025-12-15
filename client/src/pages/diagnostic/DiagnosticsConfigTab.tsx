import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { useGet } from "@/hooks/UseApi";
import { config as clientConfig } from "@/config";

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
  const theme = useTheme();
  const { response, loading, error } = useGet<{
    message: string;
    data: EnvConfig;
  }>("/diagnostic/env", {}, { refreshInterval: clientConfig.GLOBAL_REFRESH });

  const data = response?.data;
  const clientEntries = Object.entries(clientConfig as Record<string, any>);

  if (!data && !loading && !error) return null;

  return (
    <Stack spacing={theme.spacing(8)}>
      {data && (
        <Stack spacing={theme.spacing(3)}>
          <Typography variant="h1">Server environment</Typography>
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
        </Stack>
      )}

      <Stack spacing={theme.spacing(3)}>
        <Typography variant="h1">Client runtime config</Typography>
        <Stack divider={<Divider />}>
          {clientEntries.map(([key, value]) => (
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
      </Stack>
    </Stack>
  );
}
