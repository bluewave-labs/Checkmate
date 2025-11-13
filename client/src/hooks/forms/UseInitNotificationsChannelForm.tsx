import { notificationChannelSchema } from "@/validation/zod";
import { useMemo } from "react";

import { z } from "zod";
export const useInitForm = ({
  initialData,
}: {
  initialData: Partial<z.infer<typeof notificationChannelSchema>> | undefined;
}) => {
  return useMemo(() => {
    const defaults: z.infer<typeof notificationChannelSchema> = {
      name: initialData?.name || "",
      type: initialData?.type || "email",
      config: {
        url: initialData?.config?.url || "",
        emailAddress: initialData?.config?.emailAddress || "",
      },
    };
    return { defaults };
  }, [initialData]);
};
