// Components
import { Box, Stack } from "@mui/material";
import DataTable from "@/Components/v1/Table/index.jsx";
import Icon from "@/Components/v1/Icon";
import Host from "@/Components/v1/Host/index.jsx";
import { StatusLabel } from "@/Components/v1/Label/index.jsx";
import BarChart from "@/Components/v1/Charts/BarChart/index.jsx";
import ActionsMenu from "@/Components/v1/ActionsMenu/index.jsx";

import LoadingSpinner from "../LoadingSpinner/index.jsx";
import TableSkeleton from "@/Components/v1/Table/skeleton.jsx";

// Utils
import { useTheme } from "@emotion/react";
import { useMonitorUtils } from "../../../../../Hooks/useMonitorUtils.js";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

/**
 * UptimeDataTable displays a table of uptime monitors with sorting, searching, and action capabilities
 * @param {Object} props - Component props
 * @param {boolean} props.isAdmin - Whether the current user has admin privileges
 * @param {boolean} props.isLoading - Loading state of the table
 * @param {Array<{
 *   id: string,
 *   url: string,
 *   title: string,
 *   percentage: number,
 *   percentageColor: string,
 *   monitor: {
 *     id: string,
 *     type: string,
 *     checks: Array
 *   }
 * }>} props.monitors - Array of monitor objects to display
 * @param {number} props.monitorCount - Total count of monitors
 * @param {Object} props.sort - Current sort configuration
 * @param {string} props.sort.field - Field to sort by
 * @param {'asc'|'desc'} props.sort.order - Sort direction
 * @param {Function} props.setSort - Callback to update sort configuration
 * @param {string} props.search - Current search query
 * @param {Function} props.setSearch - Callback to update search query
 * @param {boolean} props.isSearching - Whether a search is in progress
 * @param {Function} props.setIsLoading - Callback to update loading state
 * @param {Function} props.triggerUpdate - Callback to trigger a data refresh
 * @returns {JSX.Element} Rendered component
 */
const UptimeDataTable = ({
	isAdmin,
	isSearching,
	filteredMonitors,
	sort,
	setSort,
	triggerUpdate,
	monitorsAreLoading,
}) => {
	// Utils
	const navigate = useNavigate();
	const { determineState } = useMonitorUtils();
	const theme = useTheme();
	const { t } = useTranslation();

	// Local state
	// Handlers
	const handleSort = (field) => {
		let order = "";
		if (sort?.field !== field) {
			order = "desc";
		} else {
			order = sort?.order === "asc" ? "desc" : "asc";
		}
		setSort({ field, order });
	};

	const headers = [
		{
			id: "name",
			content: (
				<Stack
					gap={theme.spacing(4)}
					alignItems="center"
					direction="row"
					onClick={() => handleSort("name")}
				>
					{t("host")}
					<Stack
						justifyContent="center"
						style={{
							visibility: sort?.field === "name" ? "visible" : "hidden",
						}}
					>
						{sort?.order === "asc" ? (
							<Icon
								name="ArrowUp"
								size={18}
							/>
						) : (
							<Icon
								name="ArrowDown"
								size={18}
							/>
						)}
					</Stack>
				</Stack>
			),
			render: (row) => (
				<Host
					key={row.id}
					url={row.url}
					title={row.name}
					percentageColor={row.percentageColor}
					percentage={row.percentage}
				/>
			),
		},
		{
			id: "status",
			content: (
				<Stack
					direction="row"
					gap={theme.spacing(4)}
					alignItems="center"
					display={"inline-flex"}
					onClick={() => handleSort("status")}
				>
					{" "}
					{t("status")}
					<Stack
						justifyContent="center"
						style={{
							visibility: sort?.field === "status" ? "visible" : "hidden",
						}}
					>
						{sort?.order === "asc" ? (
							<Icon
								name="ArrowUp"
								size={18}
							/>
						) : (
							<Icon
								name="ArrowDown"
								size={18}
							/>
						)}
					</Stack>
				</Stack>
			),
			render: (row) => {
				const status = determineState(row.monitor);
				return (
					<StatusLabel
						status={status}
						text={status}
						customStyles={{ textTransform: "capitalize" }}
					/>
				);
			},
		},
		{
			id: "responseTime",
			content: t("responseTime"),
			render: (row) => (
				<Box
					display="flex"
					justifyContent="center"
				>
					<BarChart checks={row.monitor.checks.slice().reverse()} />
				</Box>
			),
		},
		{
			id: "type",
			content: t("type"),
			render: (row) => (
				<span style={{ textTransform: "uppercase" }}>
					{row.monitor.type === "http" ? "HTTP(s)" : row.monitor.type}
				</span>
			),
		},
		{
			id: "actions",
			content: t("actions"),
			render: (row) => (
				<ActionsMenu
					monitor={row.monitor}
					isAdmin={isAdmin}
					updateRowCallback={triggerUpdate}
					pauseCallback={triggerUpdate}
				/>
			),
		},
	];

	if (monitorsAreLoading) {
		return <TableSkeleton />;
	}

	return (
		<Box position="relative">
			<LoadingSpinner shouldRender={isSearching} />
			<DataTable
				headers={headers}
				data={filteredMonitors}
				config={{
					rowSX: {
						cursor: "pointer",
						"&:hover td": {
							backgroundColor: theme.palette.tertiary.main,
							transition: "background-color .3s ease",
						},
					},
					onRowClick: (row) => {
						navigate(`/uptime/${row.id}`);
					},
					emptyView: "No monitors found",
				}}
			/>
		</Box>
	);
};

UptimeDataTable.propTypes = {
	isSearching: PropTypes.bool,
	setSort: PropTypes.func,
	setSearch: PropTypes.func,
	triggerUpdate: PropTypes.func,
	debouncedSearch: PropTypes.string,
	onSearchChange: PropTypes.func,
	isAdmin: PropTypes.bool,
	monitors: PropTypes.array,
	filteredMonitors: PropTypes.array,
	monitorCount: PropTypes.number,
	monitorsAreLoading: PropTypes.bool,
	sort: PropTypes.shape({
		field: PropTypes.string,
		order: PropTypes.oneOf(["asc", "desc"]),
	}),
};

export default UptimeDataTable;
