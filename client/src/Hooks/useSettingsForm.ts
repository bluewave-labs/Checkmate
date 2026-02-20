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
			systemEmailIgnoreTLS: data?.systemEmailIgnoreTLS ?? false,
			systemEmailRequireTLS: data?.systemEmailRequireTLS ?? false,
			systemEmailRejectUnauthorized: data?.systemEmailRejectUnauthorized ?? true,
			systemEmailSecure: data?.systemEmailSecure ?? false,
			systemEmailPool: data?.systemEmailPool ?? false,
			showURL: data?.showURL ?? false,
			systemEmailHost: data?.systemEmailHost || "",
			systemEmailUser: data?.systemEmailUser || "",
			systemEmailAddress: data?.systemEmailAddress || "",
			systemEmailConnectionHost: data?.systemEmailConnectionHost || "localhost",
			systemEmailTLSServername: data?.systemEmailTLSServername || "",
			systemEmailPort: data?.systemEmailPort,
			globalThresholds: {
				cpu: data?.globalThresholds?.cpu ?? 0,
				memory: data?.globalThresholds?.memory ?? 0,
				disk: data?.globalThresholds?.disk ?? 0,
				temperature: data?.globalThresholds?.temperature ?? 0,
			},
			checkTTL: data?.checkTTL ?? 30,
			pagespeedApiKey: "",
			systemEmailPassword: "",
		};

		return { schema: settingsSchema, defaults };
	}, [data]);
};
