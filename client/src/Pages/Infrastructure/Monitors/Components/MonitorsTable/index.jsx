// Components
import { Box } from "@mui/material";
import DataTable from "../../../../../Components/Table";
import Host from "../../../../../Components/Host";
import { StatusLabel } from "../../../../../Components/Label";
import { Stack } from "@mui/material";
import { InfrastructureMenu } from "../MonitorsTableMenu";
import LoadingSpinner from "../../../../Uptime/Monitors/Components/LoadingSpinner";
// Assets
import CPUChipIcon from "../../../../../assets/icons/cpu-chip.svg?react";
import CustomGauge from "../../../../../Components/Charts/CustomGauge";

// Utils
import { useTheme } from "@emotion/react";
import { useMonitorUtils } from "../../../../../Hooks/useMonitorUtils";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

const MonitorsTable = ({
	isLoading,
	monitors,
	isAdmin,
	handleActionMenuDelete,
	isSearching,
}) => {
	// Utils
	const theme = useTheme();
	const { t } = useTranslation();
	const { determineState } = useMonitorUtils();
	const navigate = useNavigate();

	// Handlers
	const openDetails = (id) => {
		navigate(`/infrastructure/${id}`);
	};
	const headers = [
		{
			id: "host",
			content: t("host"),
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
			content: t("incidentsTableStatus"),
			render: (row) => (
				<StatusLabel
					status={row.status}
					text={row.status}
				/>
			),
		},
		{
			id: "frequency",
			content: t("frequency"),
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
		{ id: "cpu", content: t("cpu"), render: (row) => <CustomGauge progress={row.cpu} /> },
		{
			id: "memory",
			content: t("memory"),
			render: (row) => <CustomGauge progress={row.mem} />,
		},
		{
			id: "disk",
			content: t("disk"),
			render: (row) => <CustomGauge progress={row.disk} />,
		},
		{
			id: "actions",
			content: t("actions"),
			render: (row) => (
				<InfrastructureMenu
					monitor={row}
					isAdmin={isAdmin}
					updateCallback={handleActionMenuDelete}
					isLoading={isLoading}
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
			percentageColor,
		};
	});

	return (
		<Box position="relative">
			<LoadingSpinner shouldRender={isSearching} />
			<DataTable
				shouldRender={!isLoading}
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
					emptyView: "No monitors found",
				}}
			/>
		</Box>
	);
};

MonitorsTable.propTypes = {
	isLoading: PropTypes.bool,
	monitors: PropTypes.array,
	isAdmin: PropTypes.bool,
	handleActionMenuDelete: PropTypes.func,
	isSearching: PropTypes.bool,
};

export default MonitorsTable;
