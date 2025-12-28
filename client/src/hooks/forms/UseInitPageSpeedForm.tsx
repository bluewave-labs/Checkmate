import humanInterval from "human-interval";
import type { IMonitor } from "@/types/monitor";
import ms from "ms";
import { useMemo } from "react";
import type { FormValues, SubmitValues } from "@/pages/pagespeed/PageSpeedForm";

export const useInitForm = ({
  initialData,
}: {
  initialData: IMonitor | undefined;
}) => {
  return useMemo(() => {
    const apiToForm = (apiData: IMonitor): FormValues => {
      console.log(JSON.stringify(apiData));
      return {
        type: apiData.type,
        url: apiData.url,
        n: apiData.n,
        notificationChannels: apiData.notificationChannels,
        name: apiData.name,
        interval: ms(apiData.interval, { long: true }),
        rejectUnauthorized: apiData.rejectUnauthorized,
      };
    };

    const formToApi = (form: FormValues): SubmitValues => {
      const submitData: SubmitValues = {
        type: form.type,
        url: form.url,
        n: form.n,
        notificationChannels: form.notificationChannels,
        name: form.name,
        interval: humanInterval(form.interval),
        rejectUnauthorized: form.rejectUnauthorized,
      };
      return submitData;
    };

    const defaults: FormValues = initialData
      ? apiToForm(initialData)
      : {
          type: "pagespeed",
          url: "",
          n: 3,
          notificationChannels: [],
          name: "",
          interval: "3 minutes",
          rejectUnauthorized: true,
        };

    return { defaults, formToApi };
  }, [initialData]);
};
