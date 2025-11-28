import { systemSettingsSchema } from "@/validation/zod";
import { useMemo } from "react";

import { z } from "zod";
export const useInitForm = ({
  initialData,
}: {
  initialData: Partial<z.infer<typeof systemSettingsSchema>> | undefined;
}) => {
  return useMemo(() => {
    const defaults: z.infer<typeof systemSettingsSchema> = {
      systemEmailHost: initialData?.systemEmailHost ?? "",
      // @ts-ignore
      systemEmailPort:
        initialData?.systemEmailPort !== undefined &&
        initialData?.systemEmailPort !== null
          ? String(initialData.systemEmailPort)
          : "",
      systemEmailAddress: initialData?.systemEmailAddress ?? "",
      systemEmailPassword: initialData?.systemEmailPassword ?? "",
      systemEmailUser: initialData?.systemEmailUser ?? "",
      systemEmailConnectionHost:
        initialData?.systemEmailConnectionHost ?? "localhost",
      systemEmailTLSServername: initialData?.systemEmailTLSServername ?? "",
      systemEmailSecure: initialData?.systemEmailSecure ?? false,
      systemEmailPool: initialData?.systemEmailPool ?? false,
      systemEmailIgnoreTLS: initialData?.systemEmailIgnoreTLS ?? false,
      systemEmailRequireTLS: initialData?.systemEmailRequireTLS ?? false,
      systemEmailRejectUnauthorized:
        initialData?.systemEmailRejectUnauthorized ?? true,
      checksRetentionDays: initialData?.checksRetentionDays ?? 90,
    };
    return { defaults };
  }, [initialData]);
};
