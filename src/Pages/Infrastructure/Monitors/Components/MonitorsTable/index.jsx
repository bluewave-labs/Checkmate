// Components
import DataTable from "../../../../../Components/Table";
import Host from "../../../../../Components/Host";
import { StatusLabel } from "../../../../../Components/Label";
import { Stack } from "@mui/material";
import { InfrastructureMenu } from "../MonitorsTableMenu";
// Assets
import CPUChipIcon from "../../../../../assets/icons/cpu-chip.svg?react";
import CustomGauge from "../../../../../Components/Charts/CustomGauge";

// Utils
import { useTheme } from "@emotion/react";
import useUtils from "../../../../Uptime/Monitors/Hooks/useUtils";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const MonitorsTable = ({ shouldRender, monitors, isAdmin, handleActionMenuDelete }) => {
	// Utils
	const theme = useTheme();
	const { determineState } = useUtils();
	const navigate = useNavigate();

	// Handlers
	const openDetails = (id) => {
		navigate(`/infrastructure/${id}`);
	};
	const headers = [
		{
			id: "host",
			content: "Host",
			render: (row) => (
				<Host
					title={row.name}
					url={row.url}
					percentage={row.uptimePercentage}
					percentageColor={row.percentageColor}
				/>
			),
		},
		{
			id: "status",
			content: "Status",
			render: (row) => (
				<StatusLabel
					status={row.status}
					text={row.status}
				/>
			),
		},
		{
			id: "frequency",
			content: "Frequency",
			render: (row) => (
				<Stack
					direction={"row"}
					justifyContent={"center"}
					alignItems={"center"}
					gap=".25rem"
				>
					<CPUChipIcon
						width={20}
						height={20}
					/>
					{row.processor}
				</Stack>
			),
		},
		{ id: "cpu", content: "CPU", render: (row) => <CustomGauge progress={row.cpu} /> },
		{ id: "mem", content: "Mem", render: (row) => <CustomGauge progress={row.mem} /> },
		{ id: "disk", content: "Disk", render: (row) => <CustomGauge progress={row.disk} /> },
		{
			id: "actions",
			content: "Actions",
			render: (row) => (
				<InfrastructureMenu
					monitor={row}
					isAdmin={isAdmin}
					updateCallback={handleActionMenuDelete}
				/>
			),
		},
	];

	const data = monitors?.map((monitor) => {
		const processor =
			((monitor.checks[0]?.cpu?.frequency ?? 0) / 1000).toFixed(2) + " GHz";
		const cpu = (monitor?.checks[0]?.cpu.usage_percent ?? 0) * 100;
		const mem = (monitor?.checks[0]?.memory.usage_percent ?? 0) * 100;
		const disk = (monitor?.checks[0]?.disk[0]?.usage_percent ?? 0) * 100;
		const status = determineState(monitor);
		const uptimePercentage = ((monitor?.uptimePercentage ?? 0) * 100)
			.toFixed(2)
			.toString();
		const percentageColor =
			monitor.uptimePercentage < 0.25
				? theme.palette.error.main
				: monitor.uptimePercentage < 0.5
					? theme.palette.warning.main
					: theme.palette.success.main;

		return {
			id: monitor._id,
			name: monitor.name,
			url: monitor.url,
			processor,
			cpu,
			mem,
			disk,
			status,
			uptimePercentage,
			percentageColor,
		};
	});

	return (
		<DataTable
			shouldRender={shouldRender}
			headers={headers}
			data={data}
			config={{
				/* TODO this behavior seems to be repeated. Put it on the root table? */
				rowSX: {
					cursor: "pointer",
					"&:hover td": {
						backgroundColor: theme.palette.tertiary.main,
						transition: "background-color .3s ease",
					},
				},
				onRowClick: (row) => openDetails(row.id),
			}}
		/>
	);
};

MonitorsTable.propTypes = {
	shouldRender: PropTypes.bool,
	monitors: PropTypes.array,
	isAdmin: PropTypes.bool,
	handleActionMenuDelete: PropTypes.func,
};

export default MonitorsTable;
