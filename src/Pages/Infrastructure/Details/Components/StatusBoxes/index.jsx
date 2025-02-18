// Components
import { Stack, Typography } from "@mui/material";
import StatusBoxes from "../../../../../Components/StatusBoxes";
import StatBox from "../../../../../Components/StatBox";

//Utils
import useUtils from "../../../../../Pages/Uptime/Monitors/Hooks/useUtils";
import { useHardwareUtils } from "../../Hooks/useHardwareUtils";

const InfraStatBoxes = ({ shouldRender, monitor }) => {
	// Utils
	const { formatBytes } = useHardwareUtils();
	const { statusStyles, determineState } = useUtils();

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
				sx={statusStyles[determineState(monitor)]}
				heading="Status"
				subHeading={determineState(monitor)}
			/>
			<StatBox
				heading="CPU (Physical)"
				subHeading={
					<>
						{physicalCores}
						<Typography component="span">cores</Typography>
					</>
				}
			/>
			<StatBox
				key={2}
				heading="CPU (Logical)"
				subHeading={
					<>
						{logicalCores}
						<Typography component="span">cores</Typography>
					</>
				}
			/>
			<StatBox
				heading="CPU Frequency"
				subHeading={
					<>
						{(cpuFrequency / 1000).toFixed(2)}
						<Typography component="span">Ghz</Typography>
					</>
				}
			/>
			<StatBox
				heading="Average CPU Temperature"
				subHeading={
					<>
						{cpuTemperature.toFixed(2)}
						<Typography component="span">C</Typography>
					</>
				}
			/>
			<StatBox
				heading="Memory"
				subHeading={formatBytes(memoryTotalBytes)}
			/>
			<StatBox
				heading="Disk"
				subHeading={formatBytes(diskTotalBytes)}
			/>
			<StatBox
				heading="Uptime"
				subHeading={
					<>
						{(uptimePercentage * 100).toFixed(2)}
						<Typography component="span">%</Typography>
					</>
				}
			/>
			<StatBox
				key={8}
				heading="OS"
				subHeading={osPlatform}
			/>
		</StatusBoxes>
	);
};

export default InfraStatBoxes;
