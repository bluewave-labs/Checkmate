import { PageSpeedForm } from "@/pages/pagespeed/PageSpeedForm";

import { useGet, usePost } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import { useNavigate } from "react-router";
import type { NotificationChannel } from "@/types/notification-channel";
import type { SubmitValues } from "@/pages/pagespeed/PageSpeedForm";
const UptimeCreatePage = () => {
  const navigate = useNavigate();
  const { response } = useGet<ApiResponse<NotificationChannel[]>>(
    "/notification-channels"
  );
  const { post, loading, error } = usePost<SubmitValues>();

  const onSubmit = async (data: SubmitValues) => {
    const result = await post("/monitors", data);
    if (result) {
      navigate("/pagespeed");
    } else {
      console.error(error);
    }
  };

  const notificationOptions = response?.data ?? [];
  return (
    <PageSpeedForm
      onSubmit={onSubmit}
      notificationOptions={notificationOptions}
      loading={loading}
    />
  );
};

export default UptimeCreatePage;
