import ms from "ms";
import { useMemo } from "react";
import type {
  FormValues,
  SubmitValues,
} from "@/pages/infrastructure/InfraForm";
import type { IMonitor } from "@/types/monitor";
import humanInterval from "human-interval";

export const useInitForm = ({
  initialData,
}: {
  initialData: IMonitor | undefined;
}) => {
  return useMemo(() => {
    const apiToForm = (apiData: IMonitor): FormValues => {
      const formData: FormValues = {
        type: apiData.type,
        url: apiData.url,
        secret: apiData.secret,
        n: apiData.n,
        notificationChannels: apiData.notificationChannels,
        name: apiData.name,
        interval: ms(apiData.interval, { long: true }),
        rejectUnauthorized: apiData.rejectUnauthorized,
        thresholds: apiData.thresholds,
      };
      return formData;
    };

    const formToApi = (formData: FormValues): SubmitValues => {
      const submitData: SubmitValues = {
        type: formData.type,
        url: formData.url,
        secret: formData.secret,
        n: formData.n,
        notificationChannels: formData.notificationChannels,
        name: formData.name,
        interval: humanInterval(formData.interval),
        rejectUnauthorized: formData.rejectUnauthorized,
        thresholds: formData.thresholds,
      };
      return submitData;
    };

    const defaults: FormValues = initialData
      ? apiToForm(initialData)
      : {
          type: "infrastructure",
          url: "",
          secret: "",
          n: 3,
          notificationChannels: [],
          name: "",
          interval: "1 minute",
          rejectUnauthorized: true,
          thresholds: {
            cpu: 100,
            memory: 100,
            disk: 100,
            temperature: 100,
          },
        };
    return { defaults, apiToForm, formToApi };
  }, [initialData]);
};
