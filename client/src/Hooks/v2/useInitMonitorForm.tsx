import { monitorSchema } from "@/Validation/v2/zod";
import { z } from "zod";
export const useInitForm = ({
	initialData,
}: {
	initialData: Partial<z.infer<typeof monitorSchema>> | undefined;
}) => {
	const defaults: z.infer<typeof monitorSchema> = {
		type: initialData?.type || "http",
		url: initialData?.url || "",
		n: initialData?.n || 3,
		notificationChannels: initialData?.notificationChannels || [],
		name: initialData?.name || "",
		interval: initialData?.interval || "1 minute",
	};
	return { defaults };
};
