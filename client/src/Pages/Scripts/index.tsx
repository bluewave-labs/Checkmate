import { BasePageWithStates } from "@/Components/design-elements";
import { Dialog } from "@/Components/inputs";
import { HeaderCreate } from "@/Components/common";

import { useState } from "react";
import { useGet, useDelete } from "@/Hooks/UseApi";
import { useTranslation } from "react-i18next";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import type { Script } from "@/Types/Monitor";
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	IconButton,
	useTheme,
} from "@mui/material";
import { Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";

const ScriptsPage = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isAdmin = useIsAdmin();
	const navigate = useNavigate();

	const [selectedScript, setSelectedScript] = useState<Script | null>(null);
	const isDialogOpen = Boolean(selectedScript);

	const {
		data: scripts,
		isLoading,
		isValidating,
		error,
		refetch,
	} = useGet<Script[]>("/scripts", {}, { keepPreviousData: true });

	const { deleteFn, loading: isDeleting } = useDelete();

	const handleConfirm = async () => {
		if (!selectedScript) return;
		await deleteFn(`/scripts/${selectedScript.id}`);
		setSelectedScript(null);
		refetch();
	};

	const handleCancel = () => {
		setSelectedScript(null);
	};

	return (
		<BasePageWithStates
			headerKey="scripts"
			page={t("pages.scripts.fallback.title", "Scripts")}
			description={t("pages.scripts.fallback.description", "Manage scripts that power your script monitors.")}
			loading={isLoading || isValidating}
			error={!!error}
			totalCount={scripts?.length ?? 0}
			actionButtonText={t("pages.scripts.fallback.actionButton", "Create your first script")}
			actionLink="/scripts/create"
		>
			<HeaderCreate
				path="/scripts/create"
				isLoading={isLoading || isValidating}
				isAdmin={isAdmin}
			/>
			<TableContainer
				component={Paper}
				sx={{ bgcolor: theme.palette.background.paper, borderRadius: theme.shape.borderRadius }}
			>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>{t("pages.scripts.table.name", "Name")}</TableCell>
							<TableCell>{t("pages.scripts.table.runtime", "Runtime")}</TableCell>
							<TableCell>{t("pages.scripts.table.updated", "Last modified")}</TableCell>
							<TableCell align="right">{t("pages.scripts.table.actions", "Actions")}</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{(scripts ?? []).map((script) => (
							<TableRow
								key={script.id}
								hover
							>
								<TableCell>{script.name}</TableCell>
								<TableCell>{script.runtime}</TableCell>
								<TableCell>{new Date(script.updatedAt).toLocaleString()}</TableCell>
								<TableCell align="right">
									{isAdmin && (
										<>
											<IconButton
												onClick={() => navigate(`/scripts/configure/${script.id}`)}
												aria-label={t("common.actions.edit", "Edit") as string}
												size="small"
											>
												<Pencil size={16} />
											</IconButton>
											<IconButton
												onClick={() => setSelectedScript(script)}
												aria-label={t("common.actions.delete", "Delete") as string}
												size="small"
											>
												<Trash2 size={16} />
											</IconButton>
										</>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
			<Dialog
				open={isDialogOpen}
				title={t("common.dialogs.delete.title")}
				content={t("common.dialogs.delete.description")}
				onConfirm={handleConfirm}
				onCancel={handleCancel}
				loading={isDeleting}
			/>
		</BasePageWithStates>
	);
};

export default ScriptsPage;
