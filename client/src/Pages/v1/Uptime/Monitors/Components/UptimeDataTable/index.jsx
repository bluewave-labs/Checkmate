// Components
import { Box, Stack, Typography, Button } from "@mui/material";
import Checkbox from "@/Components/v1/Inputs/Checkbox/index.jsx";
import Search from "@/Components/v1/Inputs/Search/index.jsx";
import { GenericDialog } from "@/Components/v1/Dialog/genericDialog.jsx";
import Dialog from "@/Components/v1/Dialog/index.jsx";
import DataTable from "@/Components/v1/Table/index.jsx";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import Host from "@/Components/v1/Host/index.jsx";
import { StatusLabel } from "@/Components/v1/Label/index.jsx";
import BarChart from "@/Components/v1/Charts/BarChart/index.jsx";
import ActionsMenu from "@/Components/v1/ActionsMenu/index.jsx";
import LoadingSpinner from "../LoadingSpinner/index.jsx";
import TableSkeleton from "@/Components/v1/Table/skeleton.jsx";

// Utils
import { useTheme } from "@emotion/react";
import { useMonitorUtils } from "../../../../../../Hooks/v1/useMonitorUtils.js";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { networkService } from "../../../../../../Utils/NetworkService.js";
import { createToast } from "../../../../../../Utils/toastUtils.jsx";

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
	const [notificationSearchInput, setNotificationSearchInput] = useState("");
	const [bulkLoading, setBulkLoading] = useState(false);
	const [loadingNotifications, setLoadingNotifications] = useState(false);
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

	useEffect(() => {
		const fetchNotificationChannels = async () => {
			setLoadingNotifications(true);
			try {
				const response = await networkService.getNotificationsByTeamId({});
				const channels = response.data?.data || response.data || [];
				setNotificationOptions(channels);
			} catch (error) {
				setNotificationOptions([]);
			} finally {
				setLoadingNotifications(false);
			}
		};
		if (showBulkNotifications && networkService) {
			fetchNotificationChannels();
		}
	}, [showBulkNotifications]);

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

	const callBulkAPI = async (endpoint, data) => {
		if (!networkService) return null;
		return await networkService.axiosInstance.post(endpoint, data);
	};

	const handleBulkPause = async () => {
		setBulkLoading(true);
		try {
			const result = await callBulkAPI("/monitors/bulk/toggle-active", {
				monitorIds: selectedMonitors,
				isActive: false,
			});
			if (result) {
				if (result.data?.success) {
					createToast({
						variant: "info",
						body: `Successfully paused ${selectedMonitors.length} monitor${selectedMonitors.length === 1 ? "" : "s"}`,
					});
				} else {
					createToast({
						variant: "warning",
						body: result.data?.msg || "Some monitors may not have been paused",
					});
				}
				setSelectedMonitors([]);
				triggerUpdate();
			}
		} catch (error) {
			console.error("Bulk pause failed:", error);
			createToast({
				variant: "error",
				body: `Failed to pause monitors: ${error.response?.data?.msg || error.message || "Unknown error"}`,
			});
		} finally {
			setBulkLoading(false);
		}
	};

	const handleBulkResume = async () => {
		setBulkLoading(true);
		try {
			const result = await callBulkAPI("/monitors/bulk/toggle-active", {
				monitorIds: selectedMonitors,
				isActive: true,
			});
			if (result) {
				if (result.data?.success) {
					createToast({
						variant: "info",
						body: `Successfully resumed ${selectedMonitors.length} monitor${selectedMonitors.length === 1 ? "" : "s"}`,
					});
				} else {
					createToast({
						variant: "warning",
						body: result.data?.msg || "Some monitors may not have been resumed",
					});
				}
				setSelectedMonitors([]);
				triggerUpdate();
			}
		} catch (error) {
			console.error("Bulk resume failed:", error);
			createToast({
				variant: "error",
				body: `Failed to resume monitors: ${error.response?.data?.msg || error.message || "Unknown error"}`,
			});
		} finally {
			setBulkLoading(false);
		}
	};

	const handleBulkDelete = () => {
		setShowDeleteConfirmation(true);
	};

	const confirmBulkDelete = async () => {
		setShowDeleteConfirmation(false);
		setBulkLoading(true);
		try {
			const result = await callBulkAPI("/monitors/bulk/delete", {
				monitorIds: selectedMonitors,
			});
			if (result) {
				if (result.data?.success) {
					createToast({
						variant: "info",
						body: `Successfully deleted ${selectedMonitors.length} monitor${selectedMonitors.length === 1 ? "" : "s"}`,
					});
				} else {
					createToast({
						variant: "warning",
						body: result.data?.msg || "Some monitors may not have been deleted",
					});
				}
				setSelectedMonitors([]);
				triggerUpdate();
			}
		} catch (error) {
			console.error("Bulk delete failed:", error);
			createToast({
				variant: "error",
				body: `Failed to delete monitors: ${error.response?.data?.msg || error.message || "Unknown error"}`,
			});
		} finally {
			setBulkLoading(false);
		}
	};

	const handleBulkNotificationSubmit = async () => {
		setBulkLoading(true);
		try {
			const result = await callBulkAPI("/monitors/bulk/notifications", {
				monitorIds: selectedMonitors,
				notificationChannels: selectedNotificationChannels,
			});
			if (result) {
				if (result.data?.success) {
					createToast({
						variant: "info",
						body: `Successfully updated notifications for ${selectedMonitors.length} monitor${selectedMonitors.length === 1 ? "" : "s"}`,
					});
				} else {
					createToast({
						variant: "warning",
						body: result.data?.msg || "Some monitors may not have been updated",
					});
				}
				setShowBulkNotifications(false);
				setSelectedNotificationChannels([]);
				setSelectedMonitors([]);
				triggerUpdate();
			}
		} catch (error) {
			console.error("Bulk notification update failed:", error);
			createToast({
				variant: "error",
				body: `Failed to update notifications: ${error.response?.data?.msg || error.message || "Unknown error"}`,
			});
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
				<div onClick={(e) => e.stopPropagation()}>
					<Checkbox
						id="select-all"
						label=""
						isChecked={
							selectedMonitors.length === filteredMonitors.length &&
							filteredMonitors.length > 0
						}
						onChange={handleSelectAll}
						inputProps={{ "aria-label": "Select all monitors" }}
					/>
				</div>
			),
			render: (row) => (
				<div onClick={(e) => e.stopPropagation()}>
					<Checkbox
						id={`select-${row._id}`}
						label=""
						isChecked={selectedMonitors.includes(row._id)}
						onChange={(e) => {
							e.stopPropagation();
							handleSelectMonitor(row._id);
						}}
						inputProps={{ "aria-label": `Select monitor ${row.name}` }}
					/>
				</div>
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
						backgroundColor: theme.palette.secondary.main,
						borderRadius: theme.shape.borderRadius,
						border: `1px solid ${theme.palette.primary.lowContrast}`,
						flexWrap: "wrap",
					}}
				>
					<Typography
						variant="body2"
						sx={{ color: theme.palette.secondary.contrastText }}
					>
						{selectedMonitors.length}{" "}
						{selectedMonitors.length === 1
							? t("bulkOperations.monitorSelected")
							: t("bulkOperations.monitorsSelected")}
					</Typography>
					<Button
						variant="outlined"
						size="small"
						onClick={handleBulkPause}
						disabled={bulkLoading}
						color="inherit"
					>
						{t("bulkOperations.pauseSelected")}
					</Button>
					<Button
						variant="outlined"
						size="small"
						onClick={handleBulkResume}
						disabled={bulkLoading}
						color="inherit"
					>
						{t("bulkOperations.resumeSelected")}
					</Button>
					<Button
						variant="outlined"
						size="small"
						onClick={() => setShowBulkNotifications(true)}
						disabled={bulkLoading}
						color="inherit"
					>
						{t("bulkOperations.setNotifications")}
					</Button>
					<Button
						variant="outlined"
						size="small"
						color="error"
						onClick={handleBulkDelete}
						disabled={bulkLoading}
					>
						{t("bulkOperations.deleteSelected")}
					</Button>
					<Button
						variant="text"
						size="small"
						onClick={() => setSelectedMonitors([])}
						color="inherit"
					>
						{t("bulkOperations.clearSelection")}
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
			<GenericDialog
				title={t("bulkOperations.setNotificationChannels")}
				description={`${t("bulkOperations.configureNotificationChannels")} ${selectedMonitors.length} ${selectedMonitors.length === 1 ? t("bulkOperations.selectedMonitor") : t("bulkOperations.selectedMonitors")}`}
				open={showBulkNotifications}
				onClose={() => setShowBulkNotifications(false)}
				theme={theme}
				width={500}
			>
				<Stack gap={theme.spacing(4)}>
					{loadingNotifications ? (
						<Typography
							variant="body2"
							sx={{ color: theme.palette.primary.contrastTextTertiary }}
						>
							Loading notification channels...
						</Typography>
					) : notificationOptions.length === 0 ? (
						<Typography
							variant="body2"
							sx={{
								color: theme.palette.primary.contrastTextTertiary,
								fontStyle: "italic",
							}}
						>
							{t("noNotificationChannels")}
						</Typography>
					) : (
						<>
							<Typography
								variant="caption"
								color={theme.palette.tertiary.contrastText}
							>
								{notificationOptions.length}{" "}
								{notificationOptions.length === 1
									? t("bulkOperations.notificationChannelAvailable")
									: t("bulkOperations.notificationChannelsAvailable")}
							</Typography>
						<Search
							id="bulk-notifications-search"
							label={t("bulkOperations.notificationChannels")}
							multiple={true}
							options={notificationOptions}
							filteredBy="notificationName"
							value={notificationOptions.filter((opt) =>
								selectedNotificationChannels.includes(opt._id)
							)}
							inputValue={notificationSearchInput}
							handleInputChange={setNotificationSearchInput}
							handleChange={(newValue) => {
								setSelectedNotificationChannels(newValue.map((opt) => opt._id));
							}}
							unit={t("bulkOperations.notificationChannel")}
							isAdorned={true}
						/>
					</>
				)}
					<Stack
						direction="row"
						gap={theme.spacing(4)}
						mt={theme.spacing(8)}
						justifyContent="flex-end"
					>
						<Button
							onClick={() => {
								setShowBulkNotifications(false);
								setSelectedNotificationChannels([]);
							}}
							variant="contained"
							color="secondary"
						>
							{t("cancel")}
						</Button>
						<Button
							onClick={handleBulkNotificationSubmit}
							variant="contained"
							color="accent"
							disabled={
								bulkLoading ||
								notificationOptions.length === 0 ||
								selectedNotificationChannels.length === 0
							}
						>
							{bulkLoading
								? t("bulkOperations.updating")
								: t("bulkOperations.updateNotifications")}
						</Button>
					</Stack>
				</Stack>
			</GenericDialog>
			<Dialog
				open={showDeleteConfirmation}
				theme={theme}
				title={`${t("bulkOperations.confirmDeleteMonitors")} ${selectedMonitors.length} ${selectedMonitors.length === 1 ? t("bulkOperations.selectedMonitor") : t("bulkOperations.selectedMonitors")}?`}
				description="Once deleted, these monitors cannot be retrieved."
				onCancel={() => setShowDeleteConfirmation(false)}
				confirmationButtonLabel={t("delete")}
				onConfirm={confirmBulkDelete}
				isLoading={bulkLoading}
				modelTitle="modal-delete-bulk-monitors"
				modelDescription="delete-bulk-monitors-confirmation"
			/>
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
