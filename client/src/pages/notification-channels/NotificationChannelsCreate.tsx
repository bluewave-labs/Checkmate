import { NotificationChannelsForm } from "./NotificationChannelsForm";

import { useNavigate } from "react-router";
import { usePost } from "@/hooks/UseApi";
import type { NotificationChannel } from "@/types/notification-channel";
import type { FormValues } from "./NotificationChannelsForm";

const NotificationsChannelCreatePage = () => {
  const { post, loading } = usePost<FormValues, NotificationChannel>();
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
