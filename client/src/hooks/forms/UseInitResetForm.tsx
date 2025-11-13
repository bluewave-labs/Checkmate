import { resetSchema } from "@/validation/zod";
import { useMemo } from "react";

import { z } from "zod";
export const useInitForm = ({
  initialData,
}: {
  initialData: Partial<z.infer<typeof resetSchema>> | undefined;
}) => {
  return useMemo(() => {
    const defaults: z.infer<typeof resetSchema> = {
      password: initialData?.password || "",
      confirmPassword: initialData?.confirmPassword || "",
    };
    return { defaults };
  }, [initialData]);
};
