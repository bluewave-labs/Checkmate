// Components
import { Stack, Typography } from "@mui/material";
import StatusBoxes from "../../../../../Components/StatusBoxes";
import StatBox from "../../../../../Components/StatBox";

//Utils
import useUtils from "../../../../../Pages/Uptime/Monitors/Hooks/useUtils";
import { useHardwareUtils } from "../../Hooks/useHardwareUtils";
import { useTranslation } from "react-i18next";

const InfraStatBoxes = ({ shouldRender, monitor }) => {
	// Utils
	const { formatBytes } = useHardwareUtils();
	const { determineState } = useUtils();
	const { t } = useTranslation();

	const { stats, uptimePercentage } = monitor ?? {};
	const latestCheck = stats?.aggregateData?.latestCheck;

	// Get data from latest check
	const physicalCores = latestCheck?.cpu?.physical_core ?? 0;
	const logicalCores = latestCheck?.cpu?.logical_core ?? 0;
	const cpuFrequency = latestCheck?.cpu?.frequency ?? 0;
	const cpuTemperature =
		latestCheck?.cpu?.temperature?.length > 0
			? latestCheck.cpu.temperature.reduce((acc, curr) => acc + curr, 0) /
				latestCheck.cpu.temperature.length
			: 0;
	const memoryTotalBytes = latestCheck?.memory?.total_bytes ?? 0;
	const diskTotalBytes = latestCheck?.disk[0]?.total_bytes ?? 0;
	const os = latestCheck?.host?.os ?? undefined;
	const platform = latestCheck?.host?.platform ?? undefined;
	const osPlatform =
		typeof os === "undefined" && typeof platform === "undefined"
			? undefined
			: `${os} ${platform}`;

	return (
		<StatusBoxes
			shouldRender={shouldRender}
			flexWrap="wrap"
		>
			<StatBox
				gradient={true}
				status={determineState(monitor)}
				heading={t("status")}
				subHeading={determineState(monitor)}
			/>
			<StatBox
				heading={t("cpuPhysical")}
				subHeading={
					<>
						{physicalCores}
						<Typography component="span">
							{physicalCores === 1 ? "core" : "cores"}
						</Typography>
					</>
				}
			/>
			<StatBox
				key={2}
				heading={t("cpuLogical")}
				subHeading={
					<>
						{logicalCores}
						<Typography component="span">
							{logicalCores === 1 ? "core" : "cores"}
						</Typography>
					</>
				}
			/>
			<StatBox
				heading={t("cpuFrequency")}
				subHeading={
					<>
						{(cpuFrequency / 1000).toFixed(2)}
						<Typography component="span">Ghz</Typography>
					</>
				}
			/>
			<StatBox
				heading={t("avgCpuTemperature")}
				subHeading={
					<>
						{cpuTemperature.toFixed(2)}
						<Typography component="span">°C</Typography>
					</>
				}
			/>
			<StatBox
				heading={t("memory")}
				subHeading={formatBytes(memoryTotalBytes)}
			/>
			<StatBox
				heading={t("disk")}
				subHeading={formatBytes(diskTotalBytes)}
			/>
			<StatBox
				heading={t("uptime")}
				subHeading={
					<>
						{(uptimePercentage * 100).toFixed(2)}
						<Typography component="span">%</Typography>
					</>
				}
			/>
			<StatBox
				key={8}
				heading={t("os")}
				subHeading={osPlatform}
			/>
		</StatusBoxes>
	);
};

export default InfraStatBoxes;
