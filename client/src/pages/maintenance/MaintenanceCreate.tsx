import { MaintenanceForm } from "@/pages/maintenance/MaintenanceForm";

import { useNavigate } from "react-router";
import { z } from "zod";
import { usePost, useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import { maintenanceSchema } from "@/validation/zod";
import type { IMonitor } from "@/types/monitor";
import type { IMaintenance } from "@/types/maintenance";

type FormValues = z.infer<typeof maintenanceSchema>;

const MaintenanceCreatePage = () => {
  const navigate = useNavigate();
  const { post, loading } = usePost<FormValues, IMaintenance>();
  const { response, loading: monitorsLoading } =
    useGet<ApiResponse<IMonitor[]>>("/monitors");

  const monitors = response?.data || [];
  console.log(monitors);

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
