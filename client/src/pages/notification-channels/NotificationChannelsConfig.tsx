import { NotificationChannelsForm } from "./NotificationChannelsForm";

import { useParams } from "react-router";
import { useNavigate } from "react-router";
import { z } from "zod";
import { usePatch, useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import { notificationChannelSchema } from "@/validation/zod";
import type { INotificationChannel } from "@/types/notification-channel";

type FormValues = z.infer<typeof notificationChannelSchema>;

const NotificationsChannelConfigPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { response, loading } = useGet<ApiResponse<INotificationChannel>>(
    `/notification-channels/${id}`
  );
  const { patch, loading: updating } = usePatch<
    FormValues,
    INotificationChannel
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
