import { useNavigate, useParams } from "react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Box,
	Chip,
	IconButton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	useTheme,
} from "@mui/material";
import { Check, Server, Trash2 } from "lucide-react";
import { BasePage } from "@/Components/design-elements";
import { Button, Dialog } from "@/Components/inputs";
import { useDelete, useGet } from "@/Hooks/UseApi";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import type { CaptureAgent, CaptureAgentDevice } from "@/Types/CaptureAgent";
import { LAYOUT } from "@/Utils/Theme/constants";

const CaptureAgentDevicesPage = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const isAdmin = useIsAdmin();
	const { agentId } = useParams<{ agentId: string }>();
	const { data: agent } = useGet<CaptureAgent>(
		agentId ? `/capture-agents/${agentId}` : null
	);
	const {
		data: devices,
		isLoading,
		refetch,
	} = useGet<CaptureAgentDevice[]>(agentId ? `/capture-agents/${agentId}/devices` : null);
	const { deleteFn, loading: isDeleting } = useDelete();
	const [pendingDelete, setPendingDelete] = useState<CaptureAgentDevice | null>(null);

	const handleDelete = async () => {
		if (!pendingDelete || !agentId) return;
		await deleteFn(`/capture-agents/${agentId}/devices/${pendingDelete.id}`);
		setPendingDelete(null);
		refetch();
	};

	return (
		<BasePage loading={isLoading}>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="flex-start"
			>
				<Stack>
					<Typography variant="h4">
						{t("pages.captureAgents.devices.title", "Devices")}
						{agent ? ` — ${agent.name}` : ""}
					</Typography>
					<Typography color={theme.palette.text.secondary}>
						{t(
							"pages.captureAgents.devices.description",
							"Targets the capture agent uses when executing scripts."
						)}
					</Typography>
				</Stack>
				<Stack
					direction="row"
					spacing={theme.spacing(LAYOUT.XS)}
				>
					<Button
						variant="outlined"
						onClick={() => navigate("/settings/capture-agents")}
					>
						{t("common.actions.back", "Back")}
					</Button>
					{isAdmin && (
						<Button
							variant="contained"
							onClick={() => navigate(`/settings/capture-agents/${agentId}/devices/new`)}
						>
							{t("pages.captureAgents.devices.add", "Add device")}
						</Button>
					)}
				</Stack>
			</Stack>

			{(devices?.length ?? 0) === 0 ? (
				<Box
					p={theme.spacing(LAYOUT.LG)}
					borderRadius={theme.shape.borderRadius}
					bgcolor={theme.palette.background.paper}
				>
					<Stack
						spacing={theme.spacing(LAYOUT.SM)}
						alignItems="center"
					>
						<Server
							size={32}
							color={theme.palette.text.secondary}
						/>
						<Typography color={theme.palette.text.secondary}>
							{t(
								"pages.captureAgents.devices.empty",
								"No devices yet. Devices unlock per-host variables like %%hostname%%."
							)}
						</Typography>
					</Stack>
				</Box>
			) : (
				<TableContainer>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>
									{t("pages.captureAgents.devices.columnName", "Name")}
								</TableCell>
								<TableCell>
									{t("pages.captureAgents.devices.columnHostname", "Hostname")}
								</TableCell>
								<TableCell>{t("pages.captureAgents.devices.columnIp", "IP")}</TableCell>
								<TableCell>{t("pages.captureAgents.devices.columnOs", "OS")}</TableCell>
								<TableCell>
									{t("pages.captureAgents.devices.columnAuth", "Auth")}
								</TableCell>
								<TableCell align="center">
									{t("pages.captureAgents.devices.columnCredentials", "Has creds")}
								</TableCell>
								<TableCell align="right">
									{t("pages.captureAgents.devices.columnActions", "Actions")}
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{(devices ?? []).map((device) => (
								<TableRow key={device.id}>
									<TableCell>{device.name}</TableCell>
									<TableCell>
										<Typography
											variant="body2"
											fontFamily={theme.typography.fontFamilyMonospace}
										>
											{device.hostname}
										</Typography>
									</TableCell>
									<TableCell>{device.ipAddress ?? "—"}</TableCell>
									<TableCell>
										<Chip
											label={device.os}
											size="small"
										/>
									</TableCell>
									<TableCell>{device.authType}</TableCell>
									<TableCell align="center">
										{device.hasCredentials ? (
											<Check
												size={16}
												color={theme.palette.success.main}
											/>
										) : (
											"—"
										)}
									</TableCell>
									<TableCell align="right">
										{isAdmin && (
											<IconButton
												size="small"
												color="error"
												aria-label={t("common.actions.delete", "Delete") as string}
												onClick={() => setPendingDelete(device)}
											>
												<Trash2 size={16} />
											</IconButton>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			<Dialog
				open={Boolean(pendingDelete)}
				title={t("pages.captureAgents.devices.deleteDialog.title", "Delete device?")}
				content={t(
					"pages.captureAgents.devices.deleteDialog.description",
					"Monitors that reference this device will be unable to inject device variables until you reassign them."
				)}
				onConfirm={handleDelete}
				onCancel={() => setPendingDelete(null)}
				loading={isDeleting}
				confirmColor="error"
			/>
		</BasePage>
	);
};

export default CaptureAgentDevicesPage;
