import { teamMemberSchema } from "@/validation/zod";
import { useMemo } from "react";

import { z } from "zod";
export const useInitForm = ({
  initialData,
}: {
  initialData: Partial<z.infer<typeof teamMemberSchema>> | undefined;
}) => {
  return useMemo(() => {
    const defaults: z.infer<typeof teamMemberSchema> = {
      userId: initialData?.userId || "",
      teamId: initialData?.teamId || "",
      roleId: initialData?.roleId || "",
    };
    return { defaults };
  }, [initialData]);
};
