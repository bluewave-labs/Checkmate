import { useGet, usePatch } from "@/hooks/UseApi";
import { InfraForm } from "@/pages/infrastructure/InfraForm";

import { useParams } from "react-router";
import type { ApiResponse } from "@/types/api";
import { useNavigate } from "react-router";
import type { INotificationChannel } from "@/types/notification-channel";
import type { IMonitor } from "@/types/monitor";
import type { SubmitValues } from "@/pages/infrastructure/InfraForm";

const InfraConfigurePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { response } = useGet<ApiResponse<INotificationChannel[]>>(
    "/notification-channels"
  );
  const { response: monitorResponse } = useGet<ApiResponse<any>>(
    `/monitors/${id}`
  );
  const monitor = monitorResponse?.data || null;
  const notificationOptions = response?.data ?? [];

  const { patch, loading, error } = usePatch<Partial<SubmitValues>, IMonitor>();

  if (!monitor) {
    return null;
  }

  const onSubmit = async (data: SubmitValues) => {
    const result = await patch(`/monitors/${id}`, data);
    if (result) {
      navigate(`/infrastructure/${id}`);
    } else {
      console.error(error);
    }
  };
  return (
    <InfraForm
      mode="configure"
      initialData={{
        ...monitor,
      }}
      onSubmit={onSubmit}
      notificationOptions={notificationOptions}
      loading={loading}
    />
  );
};

export default InfraConfigurePage;
