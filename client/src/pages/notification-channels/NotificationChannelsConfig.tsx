import { NotificationChannelsForm } from "./NotificationChannelsForm";

import { useParams } from "react-router";
import { useNavigate } from "react-router";
import { usePatch, useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import type { NotificationChannel } from "@/types/notification-channel";
import type { FormValues } from "./NotificationChannelsForm";

const NotificationsChannelConfigPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { response, loading } = useGet<ApiResponse<NotificationChannel>>(
    `/notification-channels/${id}`
  );
  const { patch, loading: updating } = usePatch<
    FormValues,
    NotificationChannel
  >();
  const notification = response?.data;

  const onSubmit = async (data: FormValues) => {
    const res = await patch(`/notification-channels/${id}`, data);
    if (res) {
      navigate(-1);
    }
  };
  return (
    <NotificationChannelsForm
      initialData={notification}
      onSubmit={onSubmit}
      loading={loading || updating}
    />
  );
};

export default NotificationsChannelConfigPage;
