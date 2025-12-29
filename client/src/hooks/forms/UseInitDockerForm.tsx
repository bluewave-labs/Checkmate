import ms from "ms";
import { useMemo } from "react";
import type { IMonitor } from "@/types/monitor";
import humanInterval from "human-interval";
import type { FormValues, SubmitValues } from "@/pages/docker/DockerForm";

export const useInitDockerForm = ({
  initialData,
}: {
  initialData: IMonitor | undefined;
}) => {
  return useMemo(() => {
    const apiToForm = (apiData: IMonitor): FormValues => {
      return {
        type: apiData.type,
        url: apiData.url,
        secret: apiData.secret,
        n: apiData.n,
        notificationChannels: apiData.notificationChannels,
        name: apiData.name,
        interval: ms(apiData.interval, { long: true }),
        rejectUnauthorized: apiData.rejectUnauthorized,
      };
    };

    const formToApi = (formData: FormValues): SubmitValues => {
      const value = humanInterval(formData.interval);
      return {
        type: formData.type,
        url: formData.url,
        secret: formData.secret,
        n: formData.n,
        notificationChannels: formData.notificationChannels,
        name: formData.name,
        interval: typeof value === "number" ? value : undefined,
        rejectUnauthorized: formData.rejectUnauthorized,
      };
    };

    const defaults: FormValues = initialData
      ? apiToForm(initialData)
      : {
          type: "docker",
          url: "",
          secret: "",
          n: 3,
          notificationChannels: [],
          name: "",
          interval: "1 minute",
          rejectUnauthorized: true,
        };

    return { defaults, apiToForm, formToApi };
  }, [initialData]);
};
