import { maintenanceSchema } from "@/validation/zod";
import { useMemo } from "react";

import { z } from "zod";
export const useInitForm = ({
  initialData,
}: {
  initialData: Partial<z.infer<typeof maintenanceSchema>> | undefined;
}) => {
  return useMemo(() => {
    const defaults: z.infer<typeof maintenanceSchema> = {
      name: initialData?.name || "",
      repeat: initialData?.repeat || "no repeat",
      startTime: initialData?.startTime
        ? new Date(initialData.startTime)
        : new Date(),
      endTime: initialData?.endTime
        ? new Date(initialData.endTime)
        : new Date(),
      monitors: initialData?.monitors || [],
    };
    return { defaults };
  }, [initialData]);
};
