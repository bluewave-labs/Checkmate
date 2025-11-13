import { NotificationChannelsForm } from "./NotificationChannelsForm";

import { useNavigate } from "react-router";
import { z } from "zod";
import { usePost } from "@/hooks/UseApi";
import { notificationChannelSchema } from "@/validation/zod";
import type { INotificationChannel } from "@/types/notification-channel";

type FormValues = z.infer<typeof notificationChannelSchema>;

const NotificationsChannelCreatePage = () => {
  const { post, loading } = usePost<FormValues, INotificationChannel>();
  const navigate = useNavigate();

  const onSubmit = async (data: FormValues) => {
    const res = await post("/notification-channels", data);
    if (res) {
      navigate(-1);
    }
  };
  return <NotificationChannelsForm onSubmit={onSubmit} loading={loading} />;
};

export default NotificationsChannelCreatePage;
