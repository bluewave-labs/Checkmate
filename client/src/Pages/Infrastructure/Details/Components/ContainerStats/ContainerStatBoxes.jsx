import PropTypes from "prop-types";
import StatusBoxes from "@/Components/v1/StatusBoxes/index.jsx";
import StatBox from "@/Components/v1/StatBox/index.jsx";
import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useHardwareUtils } from "../../Hooks/useHardwareUtils.jsx";

const formatUptime = (seconds) => {
	if (!seconds || seconds === 0) return "0s";

	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);

	if (days > 0) {
		return `${days}d ${hours}h`;
	} else if (hours > 0) {
		return `${hours}h ${minutes}m`;
	} else if (minutes > 0) {
		return `${minutes}m`;
	}
	return `${Math.floor(seconds)}s`;
};

const formatPercentage = (value) => {
	if (value === undefined || value === null) return "0%";
	return `${(value * 100).toFixed(1)}%`;
};

// Map container status to Checkmate monitor status for theming
const containerStatusToMonitorStatus = (status) => {
	if (status === "running") return "up";
	if (status === "stopped") return "down";
	return "pending";
};

const ContainerStatBoxes = ({ shouldRender, container }) => {
	const { t } = useTranslation();
	const { formatBytes } = useHardwareUtils();

	if (!container) {
		return <Typography>{t("noContainerSelected")}</Typography>;
	}

	const monitorStatus = containerStatusToMonitorStatus(container.status);

	return (
		<StatusBoxes
			shouldRender={shouldRender}
			flexWrap="wrap"
		>
			<StatBox
				gradient={true}
				status={monitorStatus}
				heading={t("status")}
				subHeading={container.status || "unknown"}
			/>
			<StatBox
				heading={t("type")}
				subHeading={
					<Typography component="span">
						{(container.type || "lxc").toUpperCase()}
					</Typography>
				}
			/>
			<StatBox
				heading={t("uptime")}
				subHeading={formatUptime(container.uptime)}
			/>
			<StatBox
				heading={t("cpuUsage")}
				subHeading={
					<>
						{formatPercentage(container.cpu_usage)}
						<Typography component="span">
							({container.cpu_cores || 0} {t("cores")})
						</Typography>
					</>
				}
			/>
			<StatBox
				heading={t("memoryUsage")}
				subHeading={
					<>
						{formatBytes(container.memory_used)}
						<Typography component="span"> / </Typography>
						{formatBytes(container.memory_total)}
					</>
				}
			/>
			<StatBox
				heading={t("diskUsage")}
				subHeading={
					<>
						{formatBytes(container.disk_used)}
						<Typography component="span"> / </Typography>
						{formatBytes(container.disk_total)}
					</>
				}
			/>
		</StatusBoxes>
	);
};

ContainerStatBoxes.propTypes = {
	shouldRender: PropTypes.bool.isRequired,
	container: PropTypes.shape({
		vmid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		name: PropTypes.string,
		node: PropTypes.string,
		status: PropTypes.string,
		type: PropTypes.string,
		uptime: PropTypes.number,
		cpu_cores: PropTypes.number,
		cpu_usage: PropTypes.number,
		memory_used: PropTypes.number,
		memory_total: PropTypes.number,
		memory_usage: PropTypes.number,
		swap_used: PropTypes.number,
		swap_total: PropTypes.number,
		disk_used: PropTypes.number,
		disk_total: PropTypes.number,
		disk_read: PropTypes.number,
		disk_write: PropTypes.number,
		network_in: PropTypes.number,
		network_out: PropTypes.number,
	}),
};

export default ContainerStatBoxes;
