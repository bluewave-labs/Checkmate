import { useMemo } from "react";
import type { FormValues } from "@/pages/recovery/RecoveryForm";

export const useInitForm = ({
  initialData,
}: {
  initialData: FormValues | undefined;
}) => {
  return useMemo(() => {
    const defaults: FormValues = {
      email: initialData?.email || "",
    };
    return { defaults };
  }, [initialData]);
};
