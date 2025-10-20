import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import { Button } from "@/Components/v2/Inputs";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
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
				setTimeout(() => refetch(), 500);
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
				setTimeout(() => refetch(), 500);
			}
		} catch (error) {
			console.error("Bulk resume failed:", error);
		}
	};

	const handleBulkDelete = async () => {
		if (
			!window.confirm(
				`Are you sure you want to delete ${selectedMonitors.length} monitor${selectedMonitors.length === 1 ? '' : 's'}?`
			)
		) {
			return;
		}
		try {
			const result = await bulkPost("/monitors/bulk/delete", {
				monitorIds: selectedMonitors,
			} as any);
			if (result) {
				setSelectedMonitors([]);
				setTimeout(() => refetch(), 500);
			}
		} catch (error) {
			console.error("Bulk delete failed:", error);
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
				setTimeout(() => refetch(), 500);
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
						<Checkbox
							checked={selectedMonitors.length === monitors.length && monitors.length > 0}
							indeterminate={
								selectedMonitors.length > 0 && selectedMonitors.length < monitors.length
							}
							onChange={handleSelectAll}
						/>
					</div>
				),
				render: (row) => {
					return (
						<div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
							<Checkbox
								checked={selectedMonitors.includes(row._id)}
								onChange={() => handleSelectMonitor(row._id)}
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
					<Typography variant="body2" sx={{ color: theme.palette.secondary.contrastText }}>
						{selectedMonitors.length} monitor{selectedMonitors.length === 1 ? '' : 's'} selected
					</Typography>
					<Button
						variant="outlined"
						size="small"
						onClick={handleBulkPause}
						sx={{
							color: theme.palette.secondary.contrastText,
							borderColor: theme.palette.secondary.contrastText,
							"&:hover": {
								borderColor: theme.palette.secondary.contrastText,
								backgroundColor: theme.palette.primary.main,
							},
						}}
					>
						Pause Selected
					</Button>
					<Button
						variant="outlined"
						size="small"
						onClick={handleBulkResume}
						sx={{
							color: theme.palette.secondary.contrastText,
							borderColor: theme.palette.secondary.contrastText,
							"&:hover": {
								borderColor: theme.palette.secondary.contrastText,
								backgroundColor: theme.palette.primary.main,
							},
						}}
					>
						Resume Selected
					</Button>
					<Button
						variant="outlined"
						size="small"
						onClick={() => setShowBulkNotifications(true)}
						sx={{
							color: theme.palette.secondary.contrastText,
							borderColor: theme.palette.secondary.contrastText,
							"&:hover": {
								borderColor: theme.palette.secondary.contrastText,
								backgroundColor: theme.palette.primary.main,
							},
						}}
					>
						Set Notifications
					</Button>
					<Button
						variant="outlined"
						size="small"
						onClick={handleBulkDelete}
						sx={{
							color: theme.palette.error.main,
							borderColor: theme.palette.error.main,
							"&:hover": {
								borderColor: theme.palette.error.main,
								backgroundColor: theme.palette.error.main,
								color: theme.palette.error.contrastText,
							},
						}}
					>
						Delete Selected
					</Button>
					<Button
						variant="text"
						size="small"
						onClick={() => setSelectedMonitors([])}
						sx={{
							color: theme.palette.secondary.contrastText,
							"&:hover": {
								backgroundColor: theme.palette.primary.main,
							},
						}}
					>
						Clear Selection
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
					Set Notification Channels
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
							Configure notification channels for {selectedMonitors.length} selected
							monitor{selectedMonitors.length === 1 ? '' : 's'}
						</Typography>
						{notificationOptions.length === 0 ? (
							<Typography
								variant="body2"
								sx={{ color: theme.palette.primary.contrastTextTertiary, fontStyle: "italic" }}
							>
								No notification channels configured. Please create notification channels
								first.
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
									<TextField
										{...params}
										label="Notification Channels"
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
						Cancel
					</Button>
					<Button
						onClick={handleBulkNotificationSubmit}
						variant="contained"
						disabled={bulkLoading || notificationOptions.length === 0}
						sx={{
							backgroundColor: theme.palette.accent.main,
							color: theme.palette.accent.contrastText,
							"&:hover": {
								backgroundColor: theme.palette.accent.dark,
							},
						}}
					>
						{bulkLoading ? "Updating..." : "Update Notifications"}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
};
