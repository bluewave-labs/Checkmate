import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button } from "@/Components/v2/Inputs";
import { CheckboxInput } from "@/Components/v2/Inputs/Checkbox";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { TextInput } from "@/Components/v2/Inputs";
import { Table } from "@/Components/v2/DesignElements";
import { HistogramResponseTime } from "@/Components/v2/Monitors/HistogramResponseTime";
import type { Header } from "@/Components/v2/DesignElements/Table";
import { ActionsMenu } from "@/Components/v2/ActionsMenu";
import { StatusLabel } from "@/Components/v2/DesignElements";
import { AutoCompleteInput } from "@/Components/v2/Inputs/AutoComplete";

import { useTranslation } from "react-i18next";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { usePatch, usePost, useGet } from "@/Hooks/v2/UseApi";
import type { ApiResponse } from "@/Hooks/v2/UseApi";
import { useState } from "react";

import type { IMonitor } from "@/Types/Monitor";
import type { ActionMenuItem } from "@/Components/v2/ActionsMenu";

export const MonitorTable = ({
	monitors,
	refetch,
}: {
	monitors: IMonitor[];
	refetch: Function;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const navigate = useNavigate();
	const [selectedMonitors, setSelectedMonitors] = useState<string[]>([]);
	const [showBulkNotifications, setShowBulkNotifications] = useState(false);
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
	const [selectedNotificationChannels, setSelectedNotificationChannels] = useState<
		string[]
	>([]);
	const { patch } = usePatch<ApiResponse>();
	const { post: bulkPost, loading: bulkLoading } = usePost<ApiResponse>();
	const { response: notificationResponse } = useGet<ApiResponse>(
		"/notification-channels"
	);

	const getActions = (monitor: IMonitor): ActionMenuItem[] => {
		return [
			{
				id: 1,
				label: "Open site",
				action: () => {
					window.open(monitor.url, "_blank", "noreferrer");
				},
				closeMenu: true,
			},
			{
				id: 2,
				label: "Details",
				action: () => {
					navigate(`${monitor._id}`);
				},
			},
			{
				id: 3,
				label: "Incidents",
				action: () => {
					navigate(`/v2/incidents/${monitor._id}`);
				},
			},
			{
				id: 4,
				label: "Configure",
				action: () => {
					console.log("Open configure");
				},
			},
			{
				id: 5,
				label: "Clone",
				action: () => {
					console.log("Open clone");
				},
			},
			{
				id: 6,
				label: monitor.isActive ? "Pause" : "Resume",
				action: async () => {
					await patch(`/monitors/${monitor._id}/active`);
					refetch();
				},
				closeMenu: true,
			},
			{
				id: 7,
				label: <Typography color={theme.palette.error.main}>Remove</Typography>,
				action: () => {
					console.log("Open delete");
				},
				closeMenu: true,
			},
		];
	};

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			setSelectedMonitors(monitors.map((m) => m._id));
		} else {
			setSelectedMonitors([]);
		}
	};

	const handleSelectMonitor = (monitorId: string) => {
		setSelectedMonitors((prev: string[]) =>
			prev.includes(monitorId)
				? prev.filter((id: string) => id !== monitorId)
				: [...prev, monitorId]
		);
	};

	const handleBulkPause = async () => {
		try {
			const result = await bulkPost("/monitors/bulk/toggle-active", {
				monitorIds: selectedMonitors,
				isActive: false,
			} as any);
			if (result) {
				setSelectedMonitors([]);
				refetch();
			}
		} catch (error) {
			console.error("Bulk pause failed:", error);
		}
	};

	const handleBulkResume = async () => {
		try {
			const result = await bulkPost("/monitors/bulk/toggle-active", {
				monitorIds: selectedMonitors,
				isActive: true,
			} as any);
			if (result) {
				setSelectedMonitors([]);
				refetch();
			}
		} catch (error) {
			console.error("Bulk resume failed:", error);
		}
	};

	const handleBulkDelete = () => {
		setShowDeleteConfirmation(true);
	};

	const confirmBulkDelete = async () => {
		try {
			const result = await bulkPost("/monitors/bulk/delete", {
				monitorIds: selectedMonitors,
			} as any);
			if (result) {
				setSelectedMonitors([]);
				setShowDeleteConfirmation(false);
				refetch();
			}
		} catch (error) {
			console.error("Bulk delete failed:", error);
			setShowDeleteConfirmation(false);
		}
	};

	const handleBulkNotificationSubmit = async () => {
		try {
			const result = await bulkPost("/monitors/bulk/notifications", {
				monitorIds: selectedMonitors,
				notificationChannels: selectedNotificationChannels,
			} as any);
			if (result) {
				setShowBulkNotifications(false);
				setSelectedNotificationChannels([]);
				setSelectedMonitors([]);
				refetch();
			}
		} catch (error) {
			console.error("Bulk notification update failed:", error);
		}
	};

	const notificationOptions = notificationResponse?.data ?? [];

	const getHeaders = () => {
		const headers: Header<IMonitor>[] = [
			{
				id: "select",
				content: (
					<div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
						<CheckboxInput
							checked={selectedMonitors.length === monitors.length && monitors.length > 0}
							indeterminate={
								selectedMonitors.length > 0 && selectedMonitors.length < monitors.length
							}
							onChange={handleSelectAll}
							aria-label="Select all monitors"
						/>
					</div>
				),
				render: (row) => {
					return (
						<div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
							<CheckboxInput
								checked={selectedMonitors.includes(row._id)}
								onChange={() => handleSelectMonitor(row._id)}
								aria-label={`Select monitor ${row.name}`}
							/>
						</div>
					);
				},
			},
			{
				id: "name",
				content: t("host"),
				render: (row) => {
					return row.name;
				},
			},
			{
				id: "status",
				content: t("status"),
				render: (row) => {
					return (
						<StatusLabel
							status={row.status}
							isActive={row.isActive}
						/>
					);
				},
			},
			{
				id: "histogram",
				content: t("responseTime"),
				render: (row) => {
					return (
						<Stack alignItems={"center"}>
							<HistogramResponseTime checks={row.latestChecks} />
						</Stack>
					);
				},
			},
			{
				id: "type",
				content: t("type"),
				render: (row) => {
					return row.type;
				},
			},
			{
				id: "actions",
				content: t("actions"),
				render: (row) => {
					return <ActionsMenu items={getActions(row)} />;
				},
			},
		];
		return headers;
	};

	let headers = getHeaders();

	if (isSmall) {
		headers = headers.filter((h) => h.id !== "histogram");
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
						color="inherit"
					>
						{t("bulkOperations.pauseSelected")}
					</Button>
					<Button
						variant="outlined"
						size="small"
						onClick={handleBulkResume}
						color="inherit"
					>
						{t("bulkOperations.resumeSelected")}
					</Button>
					<Button
						variant="outlined"
						size="small"
						onClick={() => setShowBulkNotifications(true)}
						color="inherit"
					>
						{t("bulkOperations.setNotifications")}
					</Button>
					<Button
						variant="outlined"
						size="small"
						onClick={handleBulkDelete}
						color="error"
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
			<Table
				headers={headers}
				data={monitors}
				onRowClick={(row) => {
					navigate(row._id);
				}}
			/>
			<Dialog
				open={showBulkNotifications}
				onClose={() => setShowBulkNotifications(false)}
				maxWidth="sm"
				fullWidth
				PaperProps={{
					sx: {
						backgroundColor: theme.palette.primary.main,
						color: theme.palette.primary.contrastText,
						border: 1,
						borderColor: theme.palette.primary.lowContrast,
					},
				}}
			>
				<DialogTitle sx={{ color: theme.palette.primary.contrastText }}>
					{t("bulkOperations.setNotificationChannels")}
				</DialogTitle>
				<DialogContent>
					<Stack
						gap={theme.spacing(4)}
						sx={{ mt: theme.spacing(2) }}
					>
						<Typography
							variant="body2"
							sx={{ color: theme.palette.primary.contrastTextTertiary }}
						>
							{t("bulkOperations.configureNotificationChannels")}{" "}
							{selectedMonitors.length}{" "}
							{selectedMonitors.length === 1
								? t("bulkOperations.selectedMonitor")
								: t("bulkOperations.selectedMonitors")}
						</Typography>
						{notificationOptions.length === 0 ? (
							<Typography
								variant="body2"
								sx={{
									color: theme.palette.primary.contrastTextTertiary,
									fontStyle: "italic",
								}}
							>
								{t("bulkOperations.noNotificationChannels")}
							</Typography>
						) : (
							<AutoCompleteInput
								multiple
								options={notificationOptions}
								getOptionLabel={(option: any) => option.name}
								value={notificationOptions.filter((o: any) =>
									selectedNotificationChannels.includes(o._id)
								)}
								onChange={(_: any, newValue: any[]) => {
									setSelectedNotificationChannels(newValue.map((o: any) => o._id));
								}}
								renderInput={(params: any) => (
									<TextInput
										{...params}
										label={t("bulkOperations.notificationChannels")}
									/>
								)}
							/>
						)}
					</Stack>
				</DialogContent>
				<DialogActions sx={{ backgroundColor: theme.palette.primary.main }}>
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
						disabled={
							bulkLoading ||
							notificationOptions.length === 0 ||
							selectedNotificationChannels.length === 0
						}
						sx={{
							backgroundColor: theme.palette.accent.main,
							color: theme.palette.accent.contrastText,
							"&:hover": {
								backgroundColor: theme.palette.accent.dark,
							},
						}}
					>
						{bulkLoading
							? t("bulkOperations.updating")
							: t("bulkOperations.updateNotifications")}
					</Button>
				</DialogActions>
			</Dialog>
			<Dialog
				open={showDeleteConfirmation}
				onClose={() => setShowDeleteConfirmation(false)}
				PaperProps={{
					sx: {
						backgroundColor: theme.palette.primary.main,
						color: theme.palette.primary.contrastText,
						border: 1,
						borderColor: theme.palette.primary.lowContrast,
					},
				}}
			>
				<DialogTitle sx={{ color: theme.palette.primary.contrastText }}>
					{t("bulkOperations.confirmDeletion")}
				</DialogTitle>
				<DialogContent>
					<Typography sx={{ color: theme.palette.primary.contrastText }}>
						{t("bulkOperations.confirmDeleteMonitors")} {selectedMonitors.length}{" "}
						{selectedMonitors.length === 1
							? t("bulkOperations.selectedMonitor")
							: t("bulkOperations.selectedMonitors")}
						?
					</Typography>
				</DialogContent>
				<DialogActions sx={{ backgroundColor: theme.palette.primary.main }}>
					<Button
						onClick={() => setShowDeleteConfirmation(false)}
						variant="outlined"
						sx={{
							color: theme.palette.primary.contrastText,
							borderColor: theme.palette.primary.contrastText,
							"&:hover": {
								borderColor: theme.palette.primary.contrastText,
								backgroundColor: theme.palette.primary.lowContrast,
							},
						}}
					>
						{t("cancel")}
					</Button>
					<Button
						onClick={confirmBulkDelete}
						variant="contained"
						disabled={bulkLoading}
						sx={{
							backgroundColor: theme.palette.error.main,
							color: theme.palette.error.contrastText,
							"&:hover": {
								backgroundColor: theme.palette.error.dark,
							},
						}}
					>
						{bulkLoading ? t("bulkOperations.deleting") : t("delete")}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
};
