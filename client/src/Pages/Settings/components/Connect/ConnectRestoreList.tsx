import { useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import prettyBytes from "pretty-bytes";
import { ValueLabel } from "@/Components/design-elements";
import { Dialog } from "@/Components/inputs";
import { usePost } from "@/Hooks/UseApi";
import { useFormatDate } from "@/Hooks/useFormatDate";
import { LAYOUT } from "@/Utils/Theme/constants";
import type {
	ConnectBackupListEntry,
	ConnectQueued,
	ConnectRestoreBody,
} from "@/Types/Connect";
import { TipButton } from "./TipButton";

export const ConnectRestoreList = ({
	backups,
	busy,
	onQueued,
}: {
	backups: ConnectBackupListEntry[];
	busy: boolean;
	onQueued: () => Promise<unknown>;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const formatDate = useFormatDate();
	const [selected, setSelected] = useState<ConnectBackupListEntry | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const { post, loading } = usePost<ConnectRestoreBody, ConnectQueued>();

	const kindText = (kind: string): string =>
		t(`pages.settings.form.connect.backup.restore.kind.${kind}`, { defaultValue: kind });

	const confirmTitle = selected
		? t("pages.settings.form.connect.backup.restore.confirmTitle", {
				date: formatDate(selected.createdAt, "dateTime"),
				kind: kindText(selected.kind),
			})
		: undefined;

	const restore = async () => {
		if (!selected) return;
		const result = await post("/connect/backup/restore", { backupId: selected.id });
		setConfirmOpen(false);
		if (!result?.success) return;
		await onQueued();
	};

	return (
		<>
			<Stack gap={theme.spacing(LAYOUT.SM)}>
				<Typography variant="h2">
					{t("pages.settings.form.connect.backup.restore.title")}
				</Typography>
				<Typography color={theme.palette.text.secondary}>
					{t("pages.settings.form.connect.backup.restore.description")}
				</Typography>
				{backups.length === 0 && (
					<Typography color={theme.palette.text.secondary}>
						{t("pages.settings.form.connect.backup.restore.empty")}
					</Typography>
				)}
				{backups.map((backup) => (
					<Stack
						key={backup.id}
						direction="row"
						alignItems="center"
						flexWrap="wrap"
						gap={theme.spacing(LAYOUT.SM)}
					>
						<Typography>{formatDate(backup.createdAt, "dateTime")}</Typography>
						<Typography color={theme.palette.text.secondary}>
							{kindText(backup.kind)}
						</Typography>
						<Typography color={theme.palette.text.secondary}>
							{prettyBytes(backup.sizeBytes)}
						</Typography>
						{!backup.restorable && (
							<ValueLabel
								value="neutral"
								text={t("pages.settings.form.connect.backup.restore.differentKey")}
							/>
						)}
						{backup.expiresAt && (
							<Typography color={theme.palette.text.secondary}>
								{t("pages.settings.form.connect.backup.restore.expires", {
									date: formatDate(backup.expiresAt, "dateTime"),
								})}
							</Typography>
						)}
						<TipButton
							tip={t("pages.settings.form.connect.tooltips.restore")}
							variant="outlined"
							color="error"
							disabled={busy || loading || !backup.restorable}
							onClick={() => {
								setSelected(backup);
								setConfirmOpen(true);
							}}
						>
							{t("pages.settings.form.connect.backup.restore.button")}
						</TipButton>
					</Stack>
				))}
			</Stack>
			<Dialog
				open={confirmOpen}
				title={confirmTitle}
				content={t("pages.settings.form.connect.backup.restore.confirmBody")}
				confirmText={t("pages.settings.form.connect.backup.restore.button")}
				confirmColor="error"
				onConfirm={() => void restore()}
				onCancel={() => setConfirmOpen(false)}
				loading={loading}
			/>
		</>
	);
};
