import { useMemo } from "react";
import { settingsSchema } from "@/Validation/settings";
import type { Settings } from "@/Types/Settings";
import type { SettingsFormInput } from "@/Validation/settings";

interface UseSettingsFormOptions {
	data?: Settings | null;
}
export const useSettingsForm = ({ data = null }: UseSettingsFormOptions = {}) => {
	return useMemo(() => {
		const defaults: SettingsFormInput = {
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
				cpu:
					data?.globalThresholds?.cpu && data.globalThresholds.cpu >= 1
						? data.globalThresholds.cpu
						: 80,
				memory:
					data?.globalThresholds?.memory && data.globalThresholds.memory >= 1
						? data.globalThresholds.memory
						: 80,
				disk:
					data?.globalThresholds?.disk && data.globalThresholds.disk >= 1
						? data.globalThresholds.disk
						: 80,
				temperature:
					data?.globalThresholds?.temperature && data.globalThresholds.temperature >= 1
						? data.globalThresholds.temperature
						: 80,
			},
			checkTTL: data?.checkTTL ?? 30,
			pagespeedApiKey: "",
			systemEmailPassword: "",
		};

		return { schema: settingsSchema, defaults };
	}, [data]);
};
