import { recoverySchema } from "@/validation/zod";
import { useMemo } from "react";

import { z } from "zod";
export const useInitForm = ({
  initialData,
}: {
  initialData: Partial<z.infer<typeof recoverySchema>> | undefined;
}) => {
  return useMemo(() => {
    const defaults: z.infer<typeof recoverySchema> = {
      email: initialData?.email || "",
    };
    return { defaults };
  }, [initialData]);
};
