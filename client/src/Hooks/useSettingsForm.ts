import { useMemo } from "react";
import { settingsSchema } from "@/Validation/settings";
import type { Settings } from "@/Types/Settings";
import type { SettingsFormData } from "@/Validation/settings";

interface UseSettingsFormOptions {
    data?: Settings | null;
}
export const useSettingsForm = ({ data = null }: UseSettingsFormOptions = {}) => {
    return useMemo(() => {
        const defaults: SettingsFormData = {
            systemEmailIgnoreTLS: data?.systemEmailIgnoreTLS || false,
            systemEmailRequireTLS: data?.systemEmailRequireTLS || false,
            systemEmailRejectUnauthorized: data?.systemEmailRejectUnauthorized || true,
            systemEmailConnectionHost: data?.systemEmailConnectionHost || "",
            systemEmailSecure: data?.systemEmailSecure || true,
            systemEmailPool: data?.systemEmailPool || false,
            showURL: data?.showURL || false,
            //timezone: data?.timezone || "UTC",
            language: data?.language || "en",
            //chartType: data?.chartType || "histogram",
            checkTTL: data?.checkTTL || 30,
            pagespeedApiKey: data?.pagespeedApiKey || "",
            systemEmailHost: data?.systemEmailHost || "",
            systemEmailPort: data?.systemEmailPort || "",
            systemEmailAddress: data?.systemEmailAddress || "",
            systemEmailUser: data?.systemEmailUser || "",
            systemEmailPassword: data?.systemEmailPassword || "",
            
        }



    }
}