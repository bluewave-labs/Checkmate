import { BasePage, BaseBox } from "@/components/design-elements";
import { TimingsChart, CheckDetailsCard } from "@/components/checks/";
import Stack from "@mui/material/Stack";

import { useParams } from "react-router";
import { useGet } from "@/hooks/UseApi";
import type { ICheck } from "@/types/check";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { ApiResponse } from "@/types/api";
import { useTheme } from "@mui/material/styles";
const CheckDetails = () => {
  const { id } = useParams();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  const { response, loading, error } = useGet<ApiResponse<ICheck>>(
    `/checks/${id}`
  );

  const check = response?.data || null;
  return (
    <BasePage loading={loading} error={error}>
      <Stack direction={isSmall ? "column" : "row"} spacing={4}>
        <BaseBox p={4} flex={1}>
          <CheckDetailsCard check={check!} />
        </BaseBox>
        <BaseBox p={4} flex={1}>
          <TimingsChart check={check} />
        </BaseBox>
      </Stack>
    </BasePage>
  );
};

export default CheckDetails;
