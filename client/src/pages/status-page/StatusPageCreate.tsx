import { StatusPageForm } from "@/pages/status-page/StatusPageForm";

import { useNavigate } from "react-router";
import { usePost, useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import type { IMonitor } from "@/types/monitor";
import type { FormValues } from "@/pages/status-page/StatusPageForm";

const StatusPageCreatePage = () => {
  const navigate = useNavigate();

  const { post, loading } = usePost<FormValues, IMonitor[]>();
  const { response, isValidating } =
    useGet<ApiResponse<IMonitor[]>>("/monitors");

  const monitors = response?.data || [];

  const onSubmit = async (data: FormValues) => {
    const res = await post("/status-pages", data);
    if (res) {
      navigate(-1);
    }
  };
  return (
    <StatusPageForm
      monitorOptions={monitors}
      onSubmit={onSubmit}
      loading={loading || isValidating}
    />
  );
};

export default StatusPageCreatePage;
