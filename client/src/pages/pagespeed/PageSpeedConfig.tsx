import { useGet, usePatch } from "@/hooks/UseApi";
import { PageSpeedForm } from "@/pages/pagespeed/PageSpeedForm";

import { useParams } from "react-router";
import type { ApiResponse } from "@/types/api";
import { useNavigate } from "react-router";
import type { NotificationChannel } from "@/types/notification-channel";
import type { IMonitor } from "@/types/monitor";
import type { SubmitValues } from "@/pages/pagespeed/PageSpeedForm";

const PageSpeedConfigurePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { response } = useGet<ApiResponse<NotificationChannel[]>>(
    "/notification-channels"
  );
  const { response: monitorResponse } = useGet<ApiResponse<any>>(
    `/monitors/${id}`
  );
  const monitor = monitorResponse?.data;
  const notificationOptions = response?.data ?? [];

  const { patch, loading, error } = usePatch<Partial<SubmitValues>, IMonitor>();

  if (!monitor) {
    return null;
  }

  const onSubmit = async (data: SubmitValues) => {
    const result = await patch(`/monitors/${id}`, data);
    if (result) {
      navigate(`/pagespeed/${id}`);
    } else {
      console.error(error);
    }
  };
  return (
    <PageSpeedForm
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

export default PageSpeedConfigurePage;
