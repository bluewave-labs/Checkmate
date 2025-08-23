import { useState } from "react";
const useInfrastructureMonitorForm = () => {
	const [infrastructureMonitor, setInfrastructureMonitor] = useState({
		url: "",
		name: "",
		notifications: [],
		notify_email: false,
		interval: 0.25,
		cpu: false,
		usage_cpu: "",
		memory: false,
		usage_memory: "",
		disk: false,
		usage_disk: "",
		temperature: false,
		usage_temperature: "",
		secret: "",
	});

	const onChangeForm = (name, value) => {
		setInfrastructureMonitor({
			...infrastructureMonitor,
			[name]: value,
		});
	};
	const handleCheckboxChange = (event) => {
		setInfrastructureMonitor({
			...infrastructureMonitor,
			[event.target.name]: event.target.checked,
		});
	};

	const updateThresholdTemplate = ({
		selectedValue,
		thresholdTemplatesState,
		infrastructureMonitor,
		setInfrastructureMonitor,
		setThresholdTemplate,
	}) => {
		const selected = selectedValue || "";
		setThresholdTemplate(selected);

		if (!selected) {
			setInfrastructureMonitor({
				...infrastructureMonitor,
				thresholdTemplate: "",
				cpu: false,
				usage_cpu: "",
				memory: false,
				usage_memory: "",
				disk: false,
				usage_disk: "",
				temperature: false,
				usage_temperature: "",
			});
			return;
		}

		const thresholds = thresholdTemplatesState[selected] || {};
		setInfrastructureMonitor({
			...infrastructureMonitor,
			thresholdTemplate: selected,
			cpu: thresholds.cpu !== undefined,
			usage_cpu: thresholds.cpu !== undefined ? thresholds.cpu.toString() : "",
			memory: thresholds.memory !== undefined,
			usage_memory: thresholds.memory !== undefined ? thresholds.memory.toString() : "",
			disk: thresholds.disk !== undefined,
			usage_disk: thresholds.disk !== undefined ? thresholds.disk.toString() : "",
			temperature: thresholds.temperature !== undefined,
			usage_temperature:
				thresholds.temperature !== undefined ? thresholds.temperature.toString() : "",
		});
	};

	const initializeInfrastructureMonitorForUpdate = (monitor) => {
		const MS_PER_MINUTE = 60000;
		const { thresholds = {} } = monitor;
		setInfrastructureMonitor({
			url: monitor.url.replace(/^https?:\/\//, ""),
			name: monitor.name || "",
			notifications: monitor.notifications || [],
			interval: monitor.interval / MS_PER_MINUTE,
			cpu: thresholds.usage_cpu !== undefined,
			usage_cpu:
				thresholds.usage_cpu !== undefined ? (thresholds.usage_cpu * 100).toString() : "",
			memory: thresholds.usage_memory !== undefined,
			usage_memory:
				thresholds.usage_memory !== undefined
					? (thresholds.usage_memory * 100).toString()
					: "",
			disk: thresholds.usage_disk !== undefined,
			usage_disk:
				thresholds.usage_disk !== undefined
					? (thresholds.usage_disk * 100).toString()
					: "",
			temperature: thresholds.usage_temperature !== undefined,
			usage_temperature:
				thresholds.usage_temperature !== undefined
					? (thresholds.usage_temperature * 100).toString()
					: "",
			secret: monitor.secret || "",
		});
	};
	return {
		infrastructureMonitor,
		setInfrastructureMonitor,
		onChangeForm,
		handleCheckboxChange,
		updateThresholdTemplate,
		initializeInfrastructureMonitorForUpdate,
	};
};
export default useInfrastructureMonitorForm;
