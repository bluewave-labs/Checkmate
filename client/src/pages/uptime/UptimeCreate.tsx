import { UptimeForm } from "./UptimeForm";

import { useGet, usePost } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import { useNavigate } from "react-router";
import type { INotificationChannel } from "@/types/notification-channel";
import type { SubmitValues } from "@/pages/uptime/UptimeForm";
const UptimeCreatePage = () => {
  const navigate = useNavigate();
  const { response } = useGet<ApiResponse<INotificationChannel[]>>(
    "/notification-channels"
  );
  const { post, loading, error } = usePost<SubmitValues>();

  const onSubmit = async (data: SubmitValues) => {
    const result = await post("/monitors", data);
    if (result) {
      navigate("/uptime");
    } else {
      console.error(error);
    }
  };

  const notificationOptions = response?.data ?? [];
  return (
    <UptimeForm
      onSubmit={onSubmit}
      notificationOptions={notificationOptions}
      loading={loading}
    />
  );
};

export default UptimeCreatePage;
