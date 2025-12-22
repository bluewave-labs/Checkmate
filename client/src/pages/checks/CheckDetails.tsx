import { BasePage } from "@/components/design-elements";
import { TimingsChart, CheckDetailsCard } from "@/components/checks/";
import Grid from "@mui/material/Grid";

import { useParams } from "react-router";
import { useGet } from "@/hooks/UseApi";
import type { ICheck } from "@/types/check";
import type { ApiResponse } from "@/types/api";
const CheckDetails = () => {
  const { id } = useParams();

  const { response, loading, error } = useGet<ApiResponse<ICheck>>(
    `/checks/${id}`
  );

  const check = response?.data || null;
  return (
    <BasePage loading={loading} error={error}>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <CheckDetailsCard check={check!} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TimingsChart check={check} />
        </Grid>
      </Grid>
    </BasePage>
  );
};

export default CheckDetails;
