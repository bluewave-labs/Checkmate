import { profileSchema } from "@/validation/zod";
import { useMemo } from "react";

import { z } from "zod";
export const useInitForm = ({
  initialData,
}: {
  initialData: Partial<z.infer<typeof profileSchema>> | undefined;
}) => {
  return useMemo(() => {
    const defaults: z.infer<typeof profileSchema> = {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      password: undefined,
      confirmPassword: undefined,
    };
    return { defaults };
  }, [initialData]);
};
