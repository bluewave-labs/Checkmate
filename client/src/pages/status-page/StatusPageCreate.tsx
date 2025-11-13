import { StatusPageForm } from "@/pages/status-page/StatusPageForm";

import { useNavigate } from "react-router";
import { z } from "zod";
import { usePost, useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import { statusPageSchema } from "@/validation/zod";
import type { IMonitor } from "@/types/monitor";

type FormValues = z.infer<typeof statusPageSchema>;

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
