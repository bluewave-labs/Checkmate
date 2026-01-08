import { useGet, usePatch } from "@/hooks/UseApi";
import DockerForm from "@/pages/docker/DockerForm";

import { useParams, useNavigate } from "react-router";
import type { ApiResponse } from "@/types/api";
import type { NotificationChannel } from "@/types/notification-channel";
import type { IMonitor } from "@/types/monitor";
import type { SubmitValues } from "@/pages/docker/DockerForm";

const DockerConfigurePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { response } = useGet<ApiResponse<NotificationChannel[]>>(
    "/notification-channels"
  );
  const { response: monitorResponse } = useGet<ApiResponse<IMonitor>>(
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
      navigate(`/docker/${id}`);
    } else {
      console.error(error);
    }
  };
  return (
    <DockerForm
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

export default DockerConfigurePage;
