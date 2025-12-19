import { BasePage } from "@/components/design-elements";

import { useParams } from "react-router";
import { useGet } from "@/hooks/UseApi";
import type { ICheck } from "@/types/check";
import type { ApiResponse } from "@/types/api";
const CheckDetails = () => {
  const { id } = useParams();
  const { response, loading, error } = useGet<ApiResponse<ICheck>>(
    `/checks/${id}`
  );

  const check = response?.data;
  return (
    <BasePage loading={loading} error={error}>
      {JSON.stringify(check)}
    </BasePage>
  );
};

export default CheckDetails;
