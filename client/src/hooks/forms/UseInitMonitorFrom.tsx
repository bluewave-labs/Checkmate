import { useMemo } from "react";
import humanInterval from "human-interval";
import type { FormValues, SubmitValues } from "@/pages/uptime/UptimeForm";
import type { IMonitor } from "@/types/monitor";
import ms from "ms";

export const useInitForm = ({
  initialData,
}: {
  initialData: IMonitor | undefined;
}) => {
  return useMemo(() => {
    const apiToForm = (apiData: IMonitor): FormValues => {
      return {
        type: apiData.type,
        url: apiData.url,
        port: apiData.port,
        n: apiData.n,
        notificationChannels: apiData.notificationChannels,
        name: apiData.name,
        interval: ms(apiData.interval, { long: true }),
        rejectUnauthorized: apiData.rejectUnauthorized,
      };
    };

    const formToApi = (formData: FormValues): SubmitValues => {
      const submitData: SubmitValues = {
        type: formData.type,
        url: formData.url,
        port: formData.type === "port" ? formData.port : undefined,
        n: formData.n,
        notificationChannels: formData.notificationChannels,
        name: formData.name,
        interval: humanInterval(formData.interval),
        rejectUnauthorized: formData.rejectUnauthorized,
      };

      return submitData;
    };

    const defaults: FormValues = initialData
      ? apiToForm(initialData)
      : {
          type: "https",
          url: "",
          port: 80,
          n: 3,
          notificationChannels: [],
          name: "",
          interval: "1 minute",
          rejectUnauthorized: true,
        };
    return { defaults, apiToForm, formToApi };
  }, [initialData]);
};
