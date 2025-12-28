import { useMemo } from "react";
import type { FormValues } from "@/pages/maintenance/MaintenanceForm";

export const useInitForm = ({
  initialData,
}: {
  initialData: Partial<FormValues> | undefined;
}) => {
  return useMemo(() => {
    const defaults: FormValues = {
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
