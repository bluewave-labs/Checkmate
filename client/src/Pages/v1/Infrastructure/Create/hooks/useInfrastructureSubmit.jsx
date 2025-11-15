import {
	useCreateMonitor,
	useUpdateMonitor,
} from "../../../../../Hooks/v1/monitorHooks.js";
const useInfrastructureSubmit = () => {
	const [createMonitor, isCreating] = useCreateMonitor();
	const [updateMonitor, isUpdating] = useUpdateMonitor();
	const buildForm = (infrastructureMonitor, https, monitorType = "hardware") => {
		const MS_PER_MINUTE = 60000;

		let form = {
			url: `http${https ? "s" : ""}://` + infrastructureMonitor.url,
			name:
				infrastructureMonitor.name === ""
					? infrastructureMonitor.url
					: infrastructureMonitor.name,
			interval: infrastructureMonitor.interval * MS_PER_MINUTE,
			statusWindowSize: infrastructureMonitor.statusWindowSize,
			statusWindowThreshold: infrastructureMonitor.statusWindowThreshold,
			secret: infrastructureMonitor.secret,
		};

		// Only add hardware-specific thresholds for hardware monitors
		if (monitorType === "hardware") {
			form.cpu = infrastructureMonitor.cpu;
			if (infrastructureMonitor.cpu) {
				form.usage_cpu = infrastructureMonitor.usage_cpu;
			}
			form.memory = infrastructureMonitor.memory;
			if (infrastructureMonitor.memory) {
				form.usage_memory = infrastructureMonitor.usage_memory;
			}
			form.disk = infrastructureMonitor.disk;
			if (infrastructureMonitor.disk) {
				form.usage_disk = infrastructureMonitor.usage_disk;
			}
			form.temperature = infrastructureMonitor.temperature;
			if (infrastructureMonitor.temperature) {
				form.usage_temperature = infrastructureMonitor.usage_temperature;
			}
		}

		return form;
	};
	const submitInfrastructureForm = async (
		infrastructureMonitor,
		form,
		isCreate,
		monitorId,
		monitorType = "hardware"
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

		// Only build thresholds for hardware monitors
		const thresholds =
			monitorType === "hardware"
				? {
						...(cpu ? { usage_cpu: usage_cpu / 100 } : {}),
						...(memory ? { usage_memory: usage_memory / 100 } : {}),
						...(disk ? { usage_disk: usage_disk / 100 } : {}),
						...(temperature ? { usage_temperature: usage_temperature / 100 } : {}),
					}
				: {};

		const finalForm = {
			...(isCreate ? {} : { _id: monitorId }),
			...rest,
			description: form.name,
			type: monitorType,
			notifications: infrastructureMonitor.notifications,
			...(Object.keys(thresholds).length > 0 ? { thresholds } : {}),
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
