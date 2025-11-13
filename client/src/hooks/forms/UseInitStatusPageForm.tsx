import { statusPageSchema } from "@/validation/zod";
import { useMemo } from "react";

import { z } from "zod";
export const useInitForm = ({
  initialData,
}: {
  initialData: Partial<z.infer<typeof statusPageSchema>> | undefined;
}) => {
  return useMemo(() => {
    const defaults: z.infer<typeof statusPageSchema> = {
      name: initialData?.name || "",
      description: initialData?.description || "",
      url: initialData?.url || Math.floor(Math.random() * 1000000).toFixed(0),
      isPublished: initialData?.isPublished || false,
      monitors: initialData?.monitors || [],
    };
    return { defaults };
  }, [initialData]);
};
