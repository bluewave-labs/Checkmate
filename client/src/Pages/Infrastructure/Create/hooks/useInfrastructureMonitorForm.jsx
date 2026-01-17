import { useState, useCallback } from "react";
const useInfrastructureMonitorForm = () => {
	const [infrastructureMonitor, setInfrastructureMonitor] = useState({
		url: "",
		name: "",
		notifications: [],
		notify_email: false,
		interval: 0.25,
		statusWindowSize: 5,
		statusWindowThreshold: 60,
		cpu: false,
		usage_cpu: "",
		memory: false,
		usage_memory: "",
		disk: false,
		usage_disk: "",
		temperature: false,
		usage_temperature: "",
		secret: "",
		selectedDisks: [],
		enableProxmoxContainers: false,
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
	const initializeInfrastructureMonitorForCreate = useCallback((globalSettings) => {
		const gt = globalSettings?.data?.settings?.globalThresholds || {};
		setInfrastructureMonitor((prev) => ({
			...prev,
			url: "",
			name: "",
			notifications: [],
			interval: 0.25,
			cpu: gt.cpu !== undefined,
			usage_cpu: gt.cpu !== undefined ? gt.cpu.toString() : "",
			memory: gt.memory !== undefined,
			usage_memory: gt.memory !== undefined ? gt.memory.toString() : "",
			disk: gt.disk !== undefined,
			usage_disk: gt.disk !== undefined ? gt.disk.toString() : "",
			temperature: gt.temperature !== undefined,
			usage_temperature: gt.temperature !== undefined ? gt.temperature.toString() : "",
			secret: "",
			selectedDisks: [],
			enableProxmoxContainers: false,
		}));
	}, []);

	const initializeInfrastructureMonitorForUpdate = useCallback((monitor) => {
		const MS_PER_MINUTE = 60000;
		const { thresholds = {} } = monitor;
		setInfrastructureMonitor((prev) => ({
			...prev,
			url: monitor.url.replace(/^https?:\/\//, ""),
			name: monitor.name || "",
			notifications: monitor.notifications || [],
			interval: monitor.interval / MS_PER_MINUTE,
			statusWindowSize: monitor.statusWindowSize,
			statusWindowThreshold: monitor.statusWindowThreshold,
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
			selectedDisks: monitor.selectedDisks || [],
			enableProxmoxContainers: monitor.enableProxmoxContainers ?? false,
		}));
	}, []);
	return {
		infrastructureMonitor,
		setInfrastructureMonitor,
		onChangeForm,
		handleCheckboxChange,
		initializeInfrastructureMonitorForCreate,
		initializeInfrastructureMonitorForUpdate,
	};
};

export default useInfrastructureMonitorForm;
