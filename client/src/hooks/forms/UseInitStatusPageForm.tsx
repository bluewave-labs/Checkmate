import { useMemo } from "react";
import type { FormValues } from "@/pages/status-page/StatusPageForm";
export const useInitForm = ({
  initialData,
}: {
  initialData: Partial<FormValues> | undefined;
}) => {
  return useMemo(() => {
    const defaults: FormValues = {
      name: initialData?.name || "",
      description: initialData?.description || "",
      url: initialData?.url || Math.floor(Math.random() * 1000000).toFixed(0),
      isPublished: initialData?.isPublished || false,
      monitors: initialData?.monitors || [],
    };
    return { defaults };
  }, [initialData]);
};
