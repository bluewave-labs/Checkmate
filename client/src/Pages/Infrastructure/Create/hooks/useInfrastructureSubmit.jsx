import { useCreateMonitor, useUpdateMonitor } from "../../../../Hooks/monitorHooks";
const useInfrastructureSubmit = () => {
	const [createMonitor, isCreating] = useCreateMonitor();
	const [updateMonitor, isUpdating] = useUpdateMonitor();
	const buildForm = (infrastructureMonitor, https) => {
		const MS_PER_MINUTE = 60000;

		let form = {
			url: `http${https ? "s" : ""}://` + infrastructureMonitor.url,
			name:
				infrastructureMonitor.name === ""
					? infrastructureMonitor.url
					: infrastructureMonitor.name,
			interval: infrastructureMonitor.interval * MS_PER_MINUTE,
			cpu: infrastructureMonitor.cpu,
			...(infrastructureMonitor.cpu
				? { usage_cpu: infrastructureMonitor.usage_cpu }
				: {}),
			memory: infrastructureMonitor.memory,
			...(infrastructureMonitor.memory
				? { usage_memory: infrastructureMonitor.usage_memory }
				: {}),
			disk: infrastructureMonitor.disk,
			...(infrastructureMonitor.disk
				? { usage_disk: infrastructureMonitor.usage_disk }
				: {}),
			temperature: infrastructureMonitor.temperature,
			...(infrastructureMonitor.temperature
				? { usage_temperature: infrastructureMonitor.usage_temperature }
				: {}),
			secret: infrastructureMonitor.secret,
		};
		return form;
	};
	const submitInfrastructureForm = async (
		infrastructureMonitor,
		form,
		isCreate,
		monitorId
	) => {
		const {
			cpu,
			usage_cpu,
			memory,
			usage_memory,
			disk,
			usage_disk,
			temperature,
			usage_temperature,
			...rest
		} = form;

		const thresholds = {
			...(cpu ? { usage_cpu: usage_cpu / 100 } : {}),
			...(memory ? { usage_memory: usage_memory / 100 } : {}),
			...(disk ? { usage_disk: usage_disk / 100 } : {}),
			...(temperature ? { usage_temperature: usage_temperature / 100 } : {}),
		};

		const finalForm = {
			...(isCreate ? {} : { _id: monitorId }),
			...rest,
			description: form.name,
			type: "hardware",
			notifications: infrastructureMonitor.notifications,
			thresholds,
		};
		// Handle create or update
		isCreate
			? await createMonitor({ monitor: finalForm, redirect: "/infrastructure" })
			: await updateMonitor({ monitor: finalForm, redirect: "/infrastructure" });
	};
	return {
		buildForm,
		submitInfrastructureForm,
		isCreating,
		isUpdating,
	};
};
export default useInfrastructureSubmit;
