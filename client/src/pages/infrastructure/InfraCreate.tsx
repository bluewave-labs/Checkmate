import { InfraForm } from "@/pages/infrastructure/InfraForm";
import humanInterval from "human-interval";
import { useNavigate } from "react-router";
import { z } from "zod";
import { monitorSchemaInfra } from "@/validation/zod";
import { useGet, usePost } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import type { INotificationChannel } from "@/types/notification-channel";
const InfraCreatePage = () => {
  type FormValues = z.infer<typeof monitorSchemaInfra>;
  type SubmitValues = Omit<FormValues, "interval"> & {
    interval: number | undefined;
  };
  const { response } = useGet<ApiResponse<INotificationChannel[]>>(
    "/notification-channels"
  );
  const { post, loading, error } = usePost<SubmitValues, any>();
  const navigate = useNavigate();

  const onSubmit = async (data: FormValues) => {
    let interval = humanInterval(data.interval);
    if (!interval) interval = 60000;
    const submitData = { ...data, interval };
    const result = await post("/monitors", submitData);
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
