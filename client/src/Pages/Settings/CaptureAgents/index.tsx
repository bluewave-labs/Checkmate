import { useNavigate } from "react-router";
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
import { Pencil, Server, Trash2 } from "lucide-react";
import { BasePage } from "@/Components/design-elements";
import { Button, Dialog } from "@/Components/inputs";
import { useDelete, useGet } from "@/Hooks/UseApi";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import type { CaptureAgent } from "@/Types/CaptureAgent";
import { LAYOUT } from "@/Utils/Theme/constants";

// CaptureAgentsListPage shows every Capture agent registered for the active
// team plus its capabilities and last contact time. The page is fully
// translated and obeys the admin-only mutation rules: read access is open
// to all signed-in users, while creating, editing, and deleting an agent
// requires the admin or superadmin role.
const CaptureAgentsListPage = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const isAdmin = useIsAdmin();
	const { data: agents, isLoading, refetch } = useGet<CaptureAgent[]>("/capture-agents");
	const { deleteFn, loading: isDeleting } = useDelete();
	const [pendingDelete, setPendingDelete] = useState<CaptureAgent | null>(null);

	const handleDelete = async () => {
		if (!pendingDelete) return;
		await deleteFn(`/capture-agents/${pendingDelete.id}`);
		setPendingDelete(null);
		refetch();
	};

	const formatDate = (value?: string) => {
		if (!value) return t("pages.captureAgents.list.never", "Never");
		return new Date(value).toLocaleString();
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
						{t("pages.captureAgents.header.title", "Capture agents")}
					</Typography>
					<Typography color={theme.palette.text.secondary}>
						{t(
							"pages.captureAgents.header.description",
							"Manage agents that collect metrics and execute scripts."
						)}
					</Typography>
				</Stack>
				{isAdmin && (
					<Button
						variant="contained"
						onClick={() => navigate("/settings/capture-agents/new")}
					>
						{t("pages.captureAgents.list.addAgent", "Add agent")}
					</Button>
				)}
			</Stack>

			{(agents?.length ?? 0) === 0 ? (
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
								"pages.captureAgents.list.empty",
								"No capture agents yet. Add your first Capture agent to start monitoring."
							)}
						</Typography>
					</Stack>
				</Box>
			) : (
				<TableContainer>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>{t("pages.captureAgents.list.columnName", "Name")}</TableCell>
								<TableCell>{t("pages.captureAgents.list.columnUrl", "URL")}</TableCell>
								<TableCell>
									{t("pages.captureAgents.list.columnCapabilities", "Capabilities")}
								</TableCell>
								<TableCell>
									{t("pages.captureAgents.list.columnLastSeen", "Last seen")}
								</TableCell>
								<TableCell align="right">
									{t("pages.captureAgents.list.columnActions", "Actions")}
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{(agents ?? []).map((agent) => (
								<TableRow key={agent.id}>
									<TableCell>{agent.name}</TableCell>
									<TableCell>
										<Typography
											variant="body2"
											fontFamily={theme.typography.fontFamilyMonospace}
										>
											{agent.url}
										</Typography>
									</TableCell>
									<TableCell>
										<Stack
											direction="row"
											spacing={theme.spacing(LAYOUT.XS)}
										>
											{agent.canCollectMetrics && (
												<Chip
													label={t("pages.captureAgents.list.chipMetrics", "Metrics")}
													size="small"
													color="primary"
												/>
											)}
											{agent.canExecuteScripts && (
												<Chip
													label={t("pages.captureAgents.list.chipScripts", "Scripts")}
													size="small"
													color="secondary"
												/>
											)}
										</Stack>
									</TableCell>
									<TableCell>{formatDate(agent.lastSeen)}</TableCell>
									<TableCell align="right">
										<Stack
											direction="row"
											justifyContent="flex-end"
											spacing={theme.spacing(LAYOUT.XS)}
										>
											<IconButton
												size="small"
												aria-label={t("pages.captureAgents.list.devices", "Devices")}
												onClick={() =>
													navigate(`/settings/capture-agents/${agent.id}/devices`)
												}
											>
												<Server size={16} />
											</IconButton>
											{isAdmin && (
												<>
													<IconButton
														size="small"
														aria-label={t("common.actions.edit", "Edit") as string}
														onClick={() =>
															navigate(`/settings/capture-agents/${agent.id}/devices`)
														}
													>
														<Pencil size={16} />
													</IconButton>
													<IconButton
														size="small"
														color="error"
														aria-label={t("common.actions.delete", "Delete") as string}
														onClick={() => setPendingDelete(agent)}
													>
														<Trash2 size={16} />
													</IconButton>
												</>
											)}
										</Stack>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			<Dialog
				open={Boolean(pendingDelete)}
				title={t("pages.captureAgents.list.deleteDialog.title", "Delete capture agent?")}
				content={t(
					"pages.captureAgents.list.deleteDialog.description",
					"This will remove the agent and every device that depends on it."
				)}
				onConfirm={handleDelete}
				onCancel={() => setPendingDelete(null)}
				loading={isDeleting}
				confirmColor="error"
			/>
		</BasePage>
	);
};

export default CaptureAgentsListPage;
