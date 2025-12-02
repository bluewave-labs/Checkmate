import { BasePage } from "@/components/design-elements";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import { useTheme } from "@mui/material/styles";
import { Navigate, useSearchParams } from "react-router-dom";
import { useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";

const BillingSuccessPage = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan");

  const { response } = useGet<ApiResponse<any>>(
    `/billing/confirm?plan=${plan}`,
    {},
    {}
  );

  const success = response?.data?.success ?? false;
  if (success === true) {
    return <Navigate to="/billing" replace />;
  } else {
    return (
      <BasePage>
        <Stack direction="row" alignItems={"center"} gap={theme.spacing(10)}>
          <CircularProgress color="accent" />
          <Typography>Awaiting confirmation..</Typography>
        </Stack>
      </BasePage>
    );
  }
};

export default BillingSuccessPage;
