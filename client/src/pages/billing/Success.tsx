import { BasePage } from "@/components/design-elements";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { Button } from "@/components/inputs";

import { useTheme } from "@mui/material/styles";
import { Navigate, useSearchParams } from "react-router-dom";
import { useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import { useEffect, useMemo, useState } from "react";

const BillingSuccessPage = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan");

  const query = useMemo(() => `/billing/confirm?plan=${plan ?? ""}`, [plan]);
  const { response, refetch } = useGet<ApiResponse<any>>(
    query,
    {},
    { refreshInterval: 2000 }
  );

  const success = response?.data?.success ?? false;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (success) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [success]);

  if (success === true) {
    return <Navigate to="/billing" replace />;
  } else {
    return (
      <BasePage>
        <Stack
          direction="column"
          gap={theme.spacing(10)}
          justifyContent={"center"}
        >
          <Typography variant="h1">Finishing subscription update...</Typography>
          <Stack direction="row" alignItems={"center"} gap={theme.spacing(10)}>
            <CircularProgress color="primary" size={28} />
            <Stack>
              <Typography variant="h2">
                {plan ? (
                  <>
                    {"Selected plan: "}
                    <span style={{ color: theme.palette.primary.main }}>
                      {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </span>
                  </>
                ) : (
                  ""
                )}
              </Typography>
              <Typography variant="h2">
                Awaiting confirmation…
                {elapsed > 0 ? ` (${elapsed}s)` : ""}
              </Typography>
            </Stack>
          </Stack>
          {elapsed >= 30 && (
            <Stack direction="row" gap={theme.spacing(4)}>
              <Typography>
                No changes detected yet. If you didn’t confirm in the portal,
                nothing will change.
              </Typography>
              <Button
                color="primary"
                variant="outlined"
                onClick={() => refetch?.()}
              >
                Try again
              </Button>
              <Button color="primary" variant="contained" href="/billing">
                Back to billing
              </Button>
            </Stack>
          )}
        </Stack>
      </BasePage>
    );
  }
};

export default BillingSuccessPage;
