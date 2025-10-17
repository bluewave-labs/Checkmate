// Components
import { Box, Stack, Checkbox, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import DataTable from "@/Components/v1/Table/index.jsx";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import Host from "@/Components/v1/Host/index.jsx";
import { StatusLabel } from "@/Components/v1/Label/index.jsx";
import BarChart from "@/Components/v1/Charts/BarChart/index.jsx";
import ActionsMenu from "@/Components/v1/ActionsMenu/index.jsx";
import Select from "../../../../../../Components/v1/Inputs/Select";

import LoadingSpinner from "../LoadingSpinner/index.jsx";
import TableSkeleton from "@/Components/v1/Table/skeleton.jsx";

// Utils
import { useTheme } from "@emotion/react";
import { useMonitorUtils } from "../../../../../../Hooks/v1/useMonitorUtils.js";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import axiosInstance from "../../../../../../Utils/NetworkService.js";

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
	const { determineState } = useMonitorUtils();
	const theme = useTheme();
	const { t } = useTranslation();

	// Local state
	const [selectedMonitors, setSelectedMonitors] = useState([]);
	const [showBulkNotifications, setShowBulkNotifications] = useState(false);
	const [notificationOptions, setNotificationOptions] = useState([]);
	const [selectedNotificationChannels, setSelectedNotificationChannels] = useState([]);
	const [bulkLoading, setBulkLoading] = useState(false);

	// Fetch notification channels
	useEffect(() => {
		const fetchNotificationChannels = async () => {
			try {
				const response = await axiosInstance.get("/notifications");
				setNotificationOptions(response.data.data || []);
			} catch (error) {
				console.error("Failed to fetch notification channels:", error);
			}
		};
		if (showBulkNotifications) {
			fetchNotificationChannels();
		}
	}, [showBulkNotifications]);

	// Handlers
	const handleSelectAll = (event) => {
		if (event.target.checked) {
			setSelectedMonitors(filteredMonitors.map((m) => m._id));
		} else {
			setSelectedMonitors([]);
		}
	};

	const handleSelectMonitor = (monitorId) => {
		setSelectedMonitors((prev) =>
			prev.includes(monitorId)
				? prev.filter((id) => id !== monitorId)
				: [...prev, monitorId]
		);
	};

	const handleBulkPause = async () => {
		setBulkLoading(true);
		try {
			await axiosInstance.post("/monitors/bulk/toggle-active", {
				monitorIds: selectedMonitors,
				isActive: false,
			});
			setSelectedMonitors([]);
			triggerUpdate();
		} catch (error) {
			console.error("Bulk pause failed:", error);
		} finally {
			setBulkLoading(false);
		}
	};

	const handleBulkResume = async () => {
		setBulkLoading(true);
		try {
			await axiosInstance.post("/monitors/bulk/toggle-active", {
				monitorIds: selectedMonitors,
				isActive: true,
			});
			setSelectedMonitors([]);
			triggerUpdate();
		} catch (error) {
			console.error("Bulk resume failed:", error);
		} finally {
			setBulkLoading(false);
		}
	};

	const handleBulkDelete = async () => {
		if (!window.confirm(`Are you sure you want to delete ${selectedMonitors.length} monitor(s)?`)) {
			return;
		}
		setBulkLoading(true);
		try {
			await axiosInstance.post("/monitors/bulk/delete", {
				monitorIds: selectedMonitors,
			});
			setSelectedMonitors([]);
			triggerUpdate();
		} catch (error) {
			console.error("Bulk delete failed:", error);
		} finally {
			setBulkLoading(false);
		}
	};

	const handleBulkNotificationSubmit = async () => {
		setBulkLoading(true);
		try {
			await axiosInstance.post("/monitors/bulk/notifications", {
				monitorIds: selectedMonitors,
				notificationChannels: selectedNotificationChannels,
			});
			setShowBulkNotifications(false);
			setSelectedNotificationChannels([]);
			setSelectedMonitors([]);
			triggerUpdate();
		} catch (error) {
			console.error("Bulk notification update failed:", error);
		} finally {
			setBulkLoading(false);
		}
	};

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
			id: "select",
			content: (
				<Checkbox
					checked={selectedMonitors.length === filteredMonitors.length && filteredMonitors.length > 0}
					indeterminate={selectedMonitors.length > 0 && selectedMonitors.length < filteredMonitors.length}
					onChange={handleSelectAll}
				/>
			),
			render: (row) => (
				<Checkbox
					checked={selectedMonitors.includes(row._id)}
					onChange={(e) => {
						e.stopPropagation();
						handleSelectMonitor(row._id);
					}}
					onClick={(e) => e.stopPropagation()}
				/>
			),
		},
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
		<Stack gap={theme.spacing(4)}>
			{selectedMonitors.length > 0 && (
				<Box
					sx={{
						display: "flex",
						gap: theme.spacing(4),
						alignItems: "center",
						padding: theme.spacing(4),
						backgroundColor: theme.palette.background.paper,
						borderRadius: 1,
						border: `1px solid ${theme.palette.divider}`,
						flexWrap: "wrap",
					}}
				>
					<Typography variant="body2">
						{selectedMonitors.length} monitor(s) selected
					</Typography>
					<Button
						variant="outlined"
						size="small"
						onClick={handleBulkPause}
						disabled={bulkLoading}
					>
						Pause Selected
					</Button>
					<Button
						variant="outlined"
						size="small"
						onClick={handleBulkResume}
						disabled={bulkLoading}
					>
						Resume Selected
					</Button>
					<Button
						variant="outlined"
						size="small"
						onClick={() => setShowBulkNotifications(true)}
						disabled={bulkLoading}
					>
						Set Notifications
					</Button>
					<Button
						variant="outlined"
						size="small"
						color="error"
						onClick={handleBulkDelete}
						disabled={bulkLoading}
					>
						Delete Selected
					</Button>
					<Button
						variant="text"
						size="small"
						onClick={() => setSelectedMonitors([])}
					>
						Clear Selection
					</Button>
				</Box>
			)}
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
			<Dialog
				open={showBulkNotifications}
				onClose={() => setShowBulkNotifications(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>Set Notification Channels</DialogTitle>
				<DialogContent>
					<Stack gap={theme.spacing(4)} sx={{ mt: theme.spacing(2) }}>
						<Typography variant="body2">
							Configure notification channels for {selectedMonitors.length} selected monitor(s)
						</Typography>
						<Select
							id="notification-channels-select"
							label="Notification Channels"
							value={selectedNotificationChannels}
							onChange={(e) => setSelectedNotificationChannels(e.target.value)}
							options={notificationOptions.map((option) => ({
								value: option._id,
								label: option.name,
							}))}
							multiple
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							setShowBulkNotifications(false);
							setSelectedNotificationChannels([]);
						}}
						variant="text"
					>
						Cancel
					</Button>
					<Button
						onClick={handleBulkNotificationSubmit}
						variant="contained"
						color="primary"
						disabled={bulkLoading}
					>
						{bulkLoading ? "Updating..." : "Update Notifications"}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
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
