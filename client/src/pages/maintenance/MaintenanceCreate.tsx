import { MaintenanceForm } from "@/pages/maintenance/MaintenanceForm";

import { useNavigate } from "react-router";
import { usePost, useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import type { IMonitor } from "@/types/monitor";
import type { Maintenance } from "@/types/maintenance";
import type { FormValues } from "@/pages/maintenance/MaintenanceForm";

const MaintenanceCreatePage = () => {
  const navigate = useNavigate();
  const { post, loading } = usePost<FormValues, Maintenance>();
  const { response, loading: monitorsLoading } =
    useGet<ApiResponse<IMonitor[]>>("/monitors");

  const monitors = response?.data || [];

  const onSubmit = async (data: FormValues) => {
    const res = await post("/maintenance", data);
    if (res) {
      navigate(-1);
    }
  };
  return (
    <MaintenanceForm
      monitorOptions={monitors}
      onSubmit={onSubmit}
      loading={loading || monitorsLoading}
    />
  );
};

export default MaintenanceCreatePage;
