import { monitorSchemaInfra } from "@/validation/zod";
import ms from "ms";
import { useMemo } from "react";

import { z } from "zod";
export const useInitForm = ({
  initialData,
}: {
  initialData: Partial<z.infer<typeof monitorSchemaInfra>> | undefined;
}) => {
  return useMemo(() => {
    let humanInterval = "1 minute";
    if (initialData?.interval) {
      const parsed = Number(initialData.interval);
      if (!isNaN(parsed)) {
        humanInterval = ms(parsed, { long: true });
      }
    }

    type InfraValues = z.infer<typeof monitorSchemaInfra>;
    const defaults: InfraValues = {
      type: "infrastructure",
      url: initialData?.url || "",
      secret: initialData?.secret || "",
      n: initialData?.n || 3,
      notificationChannels: initialData?.notificationChannels || [],
      name: initialData?.name || "",
      interval: humanInterval,
      rejectUnauthorized: true,
      thresholds: initialData?.thresholds ?? {
        cpu: 100,
        memory: 100,
        disk: 100,
        temperature: 100,
      },
    };
    return { defaults };
  }, [initialData]);
};
