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
				cpu: data?.globalThresholds?.cpu,
				memory: data?.globalThresholds?.memory,
				disk: data?.globalThresholds?.disk,
				temperature: data?.globalThresholds?.temperature,
			},
			checkTTL: data?.checkTTL ?? 30,
			pagespeedApiKey: "",
			systemEmailPassword: "",
		};

		return { schema: settingsSchema, defaults };
	}, [data]);
};
