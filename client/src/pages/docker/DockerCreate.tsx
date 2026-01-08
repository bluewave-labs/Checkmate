import DockerForm, { type SubmitValues } from "@/pages/docker/DockerForm";
import { useNavigate } from "react-router";
import { useGet, usePost } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import type { NotificationChannel } from "@/types/notification-channel";

const DockerCreatePage = () => {
  const { response } = useGet<ApiResponse<NotificationChannel[]>>(
    "/notification-channels"
  );
  const { post, loading, error } = usePost<SubmitValues, any>();
  const navigate = useNavigate();

  const onSubmit = async (data: SubmitValues) => {
    const result = await post("/monitors", data);
    if (result) {
      navigate("/docker");
    } else {
      console.error(error);
    }
  };

  const notificationOptions = response?.data ?? [];
  return (
    <DockerForm
      onSubmit={onSubmit}
      notificationOptions={notificationOptions}
      loading={loading}
    />
  );
};

export default DockerCreatePage;
