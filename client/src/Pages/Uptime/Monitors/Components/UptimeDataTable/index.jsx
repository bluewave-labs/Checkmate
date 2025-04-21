// Components
import { Box, Stack } from "@mui/material";
import DataTable from "../../../../../Components/Table";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import Host from "../../../../../Components/Host";
import { StatusLabel } from "../../../../../Components/Label";
import BarChart from "../../../../../Components/Charts/BarChart";
import ActionsMenu from "../../../../../Components/ActionsMenu";

import LoadingSpinner from "../LoadingSpinner";
import TableSkeleton from "../../../../../Components/Table/skeleton";

// Utils
import { useTheme } from "@emotion/react";
import useUtils from "../../Hooks/useUtils";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

/**
 * UptimeDataTable displays a table of uptime monitors with sorting, searching, and action capabilities
 * @param {Object} props - Component props
 * @param {boolean} props.isAdmin - Whether the current user has admin privileges
 * @param {boolean} props.isLoading - Loading state of the table
 * @param {Array<{
 *   _id: string,
 *   url: string,
 *   title: string,
 *   percentage: number,
 *   percentageColor: string,
 *   monitor: {
 *     _id: string,
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
	const { determineState } = useUtils();
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
							<ArrowUpwardRoundedIcon />
						) : (
							<ArrowDownwardRoundedIcon />
						)}
					</Stack>
				</Stack>
			),
			render: (row) => (
				<Host
					key={row._id}
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
							<ArrowUpwardRoundedIcon fontSize="18px" />
						) : (
							<ArrowDownwardRoundedIcon fontSize="18px" />
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
				<Box display="flex" justifyContent="center">
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
						navigate(`/uptime/${row._id}`);
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
