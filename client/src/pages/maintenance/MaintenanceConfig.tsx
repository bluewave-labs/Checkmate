import { MaintenanceForm } from "@/pages/maintenance/MaintenanceForm";

import { useParams } from "react-router";
import { useNavigate } from "react-router";
import { z } from "zod";
import { usePatch, useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import { maintenanceSchema } from "@/validation/zod";
import type { IMonitor } from "@/types/monitor";

type FormValues = z.infer<typeof maintenanceSchema>;

const MaintenanceConfigPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patch, loading: isPatching } = usePatch<FormValues, any>();
  const { response, loading } = useGet<ApiResponse<any>>(`/maintenance/${id}`);
  const { response: monitorsResponse, loading: monitorsLoading } =
    useGet<ApiResponse<IMonitor[]>>("/monitors");
  const maintenance = response?.data;
  const monitors = monitorsResponse?.data || [];
  const onSubmit = async (data: FormValues) => {
    const res = await patch(`/maintenance/${id}`, data);
    if (res) {
      navigate(-1);
    }
  };
  return (
    <MaintenanceForm
      monitorOptions={monitors}
      initialData={maintenance}
      onSubmit={onSubmit}
      loading={loading || isPatching || monitorsLoading}
    />
  );
};

export default MaintenanceConfigPage;
