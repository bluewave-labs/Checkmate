import { PageSpeedForm } from "@/pages/pagespeed/PageSpeedForm";

import humanInterval from "human-interval";
import { z } from "zod";
import { monitorSchema } from "@/validation/zod";
import { useGet, usePost } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import { useNavigate } from "react-router";
import type { INotificationChannel } from "@/types/notification-channel";
const UptimeCreatePage = () => {
  type FormValues = z.infer<typeof monitorSchema>;
  type SubmitValues = Omit<FormValues, "interval"> & {
    interval: number | undefined;
  };
  const navigate = useNavigate();
  const { response } = useGet<ApiResponse<INotificationChannel[]>>(
    "/notification-channels"
  );
  const { post, loading, error } = usePost<SubmitValues>();

  const onSubmit = async (data: FormValues) => {
    let interval = humanInterval(data.interval);
    if (!interval) interval = 60000;
    const submitData = { ...data, interval };
    const result = await post("/monitors", submitData);
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
