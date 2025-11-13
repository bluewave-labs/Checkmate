import { teamSchema } from "@/validation/zod";
import { useMemo } from "react";

import { z } from "zod";
export const useInitForm = ({
  initialData,
}: {
  initialData: Partial<z.infer<typeof teamSchema>> | undefined;
}) => {
  return useMemo(() => {
    const defaults: z.infer<typeof teamSchema> = {
      name: initialData?.name || "",
      description: initialData?.description || "",
      roleId: initialData?.roleId || "",
    };
    return { defaults };
  }, [initialData]);
};
