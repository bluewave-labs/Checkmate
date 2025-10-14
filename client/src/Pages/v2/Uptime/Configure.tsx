import { monitorSchema } from "@/Validation/v2/zod";
import { useGet, usePost } from "@/Hooks/v2/UseApi";
import { UptimeForm } from "@/Pages/v2/Uptime/UptimeForm";

import { useParams } from "react-router";
import type { ApiResponse } from "@/Hooks/v2/UseApi";
import humanInterval from "human-interval";
import { z } from "zod";

export const UptimeConfigurePage = () => {
	type FormValues = z.infer<typeof monitorSchema>;
	type SubmitValues = Omit<FormValues, "interval"> & { interval: number | undefined };

	const { id } = useParams();
	const { response } = useGet<ApiResponse>("/notification-channels");
	const { response: monitorResponse } = useGet<ApiResponse>(`/monitors/${id}`);
	const monitor = monitorResponse?.data || null;
	const notificationOptions = response?.data ?? [];

	const { post, loading, error } = usePost<SubmitValues, ApiResponse>();

	const onSubmit = async (data: FormValues) => {
		let interval = humanInterval(data.interval);
		if (!interval) interval = 60000;
		const submitData = { ...data, interval };
		const result = await post("/monitors", submitData);
		if (result) {
			console.log(result);
		} else {
			console.error(error);
		}
	};
	return (
		<UptimeForm
			initialData={{
				...monitor,
			}}
			onSubmit={onSubmit}
			notificationOptions={notificationOptions}
			loading={loading}
		/>
	);
};
