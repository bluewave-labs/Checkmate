import { InfraForm } from "@/pages/infrastructure/InfraForm";
import { useNavigate } from "react-router";
import { useGet, usePost } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import type { NotificationChannel } from "@/types/notification-channel";
import type { SubmitValues } from "@/pages/infrastructure/InfraForm";

const InfraCreatePage = () => {
  const { response } = useGet<ApiResponse<NotificationChannel[]>>(
    "/notification-channels"
  );
  const { post, loading, error } = usePost<SubmitValues, any>();
  const navigate = useNavigate();

  const onSubmit = async (data: SubmitValues) => {
    const result = await post("/monitors", data);
    if (result) {
      navigate("/infrastructure");
    } else {
      console.error(error);
    }
  };

  const notificationOptions = response?.data ?? [];
  return (
    <InfraForm
      onSubmit={onSubmit}
      notificationOptions={notificationOptions}
      loading={loading}
    />
  );
};

export default InfraCreatePage;
