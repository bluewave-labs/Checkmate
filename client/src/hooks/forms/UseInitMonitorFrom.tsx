import { monitorSchema } from "@/validation/zod";
import ms from "ms";
import { useMemo } from "react";

import { z } from "zod";
export const useInitForm = ({
  initialData,
}: {
  initialData: Partial<z.infer<typeof monitorSchema>> | undefined;
}) => {
  return useMemo(() => {
    let humanInterval = "1 minute";
    if (initialData?.interval) {
      const parsed = Number(initialData.interval);
      if (!isNaN(parsed)) {
        humanInterval = ms(parsed, { long: true });
      }
    }

    const defaults: z.infer<typeof monitorSchema> = {
      type: initialData?.type || "https",
      url: initialData?.url || "",
      port: initialData?.port || 80,
      n: initialData?.n || 3,
      notificationChannels: initialData?.notificationChannels || [],
      name: initialData?.name || "",
      interval: humanInterval,
      rejectUnauthorized: initialData?.rejectUnauthorized ?? true,
    };
    return { defaults };
  }, [initialData]);
};
