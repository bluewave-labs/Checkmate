import { useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import prettyBytes from "pretty-bytes";
import { ConfigBox } from "@/Components/design-elements";
import { usePost } from "@/Hooks/UseApi";
import { useFormatDate } from "@/Hooks/useFormatDate";
import { useIsSuperAdmin } from "@/Hooks/useIsAdmin";
import { LAYOUT } from "@/Utils/Theme/constants";
import type {
	ConnectBackupKind,
	ConnectBackupListEntry,
	ConnectBackupResult,
	ConnectBackupStatus,
	ConnectGenerateKeyBody,
	ConnectQueued,
	ConnectRecoveryKey,
	ConnectRunBackupBody,
} from "@/Types/Connect";
import { ConnectRestoreList } from "./ConnectRestoreList";
import { ConnectToolsMissing } from "./ConnectToolsMissing";
import { RecoveryKeyDialog } from "./RecoveryKeyDialog";
import { RecoveryKeyImportForm } from "./RecoveryKeyImportForm";
import { TipButton } from "./TipButton";

export const ConnectBackupBox = ({
	recoveryKeySet,
	backupStatus,
	busy,
	toolsReady,
	backups,
	onKeyChanged,
	onQueued,
}: {
	recoveryKeySet: boolean;
	backupStatus: ConnectBackupStatus | null;
	busy: boolean;
	toolsReady: boolean;
	backups: ConnectBackupListEntry[];
	onKeyChanged: () => Promise<unknown>;
	onQueued: () => Promise<unknown>;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const formatDate = useFormatDate();
	const isSuperAdmin = useIsSuperAdmin();
	const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
	const [confirmLostKey, setConfirmLostKey] = useState(false);
	const [showKeyImport, setShowKeyImport] = useState(false);

	const { post: postKey, loading: generatingKey } = usePost<
		ConnectGenerateKeyBody,
		ConnectRecoveryKey
	>();
	const { post: postRun, loading: startingBackup } = usePost<
		ConnectRunBackupBody,
		ConnectQueued
	>();

	const hasCloudBackups = backups.length > 0;
	const lastBackup = backupStatus?.lastBackup ?? null;
	const lastRestore = backupStatus?.lastRestore ?? null;
	const lastVerify = backupStatus?.lastVerify ?? null;
	const canSetUpKey = !recoveryKeySet && !recoveryKey && isSuperAdmin && toolsReady;
	const canReplaceKey = isSuperAdmin && hasCloudBackups;

	const generateKey = async (discardExisting: boolean) => {
		const result = await postKey("/connect/backup/recovery-key", { discardExisting });
		if (!result?.success) return;
		setRecoveryKey(result.data.recoveryKey);
		await onKeyChanged();
	};

	const handleLostKey = async () => {
		if (!confirmLostKey) {
			setConfirmLostKey(true);
			return;
		}
		setConfirmLostKey(false);
		await generateKey(true);
	};

	const runBackup = async (kind: ConnectBackupKind) => {
		const result = await postRun("/connect/backup/run", { kind });
		if (!result?.success) return;
		await onQueued();
	};

	const progressText = (): string | null => {
		const progress = backupStatus?.progress ?? null;
		if (!progress) {
			const operation = backupStatus?.operation ?? null;
			if (operation?.state !== "queued") return null;
			if (operation.type === "verify") {
				return t("pages.settings.form.connect.backup.progress.checking");
			}
			return t("pages.settings.form.connect.backup.progress.queued");
		}
		if (progress.operation === "verify" && progress.attempt === null) {
			return t("pages.settings.form.connect.backup.progress.checking");
		}
		const step = t(
			`pages.settings.form.connect.backup.progress.${progress.operation}.${progress.stage}`,
			{ attempt: progress.attempt, attempts: progress.attempts }
		);
		if (progress.percent !== null) {
			return t("pages.settings.form.connect.backup.progressWithPercent", {
				step,
				percent: progress.percent,
			});
		}
		if (progress.bytes) {
			return t("pages.settings.form.connect.backup.progressWithSize", {
				step,
				size: prettyBytes(progress.bytes),
			});
		}
		return step;
	};

	const lastBackupText = (result: ConnectBackupResult): string => {
		const date = formatDate(result.at, "dateTime");
		if (!result.ok) {
			return t("pages.settings.form.connect.backup.lastBackupFailed", {
				date,
				error: result.error ?? "",
			});
		}
		if (!result.sizeBytes) {
			return t("pages.settings.form.connect.backup.lastBackupSucceeded", { date });
		}
		return t("pages.settings.form.connect.backup.lastBackupSucceededSize", {
			date,
			size: prettyBytes(result.sizeBytes),
		});
	};

	const lastRestoreText = (result: ConnectBackupResult): string => {
		const date = formatDate(result.at, "dateTime");
		if (!result.ok) {
			return t("pages.settings.form.connect.backup.lastRestoreFailed", {
				date,
				error: result.error ?? "",
			});
		}
		return t("pages.settings.form.connect.backup.lastRestoreSucceeded", { date });
	};

	const progress = progressText();

	return (
		<>
			<ConfigBox
				title={t("pages.settings.form.connect.backup.title")}
				subtitle={t("pages.settings.form.connect.backup.description")}
				rightContent={
					<Stack
						gap={theme.spacing(LAYOUT.SM)}
						alignItems="flex-start"
					>
						{!toolsReady && <ConnectToolsMissing />}
						{progress && <Typography role="status">{progress}</Typography>}
						{canSetUpKey && showKeyImport && (
							<RecoveryKeyImportForm
								replaceExisting={false}
								busy={busy}
								lastVerify={lastVerify}
								onQueued={onQueued}
								onKeyChanged={onKeyChanged}
								onClose={() => setShowKeyImport(false)}
							/>
						)}
						{canSetUpKey && !showKeyImport && (
							<Stack gap={theme.spacing(LAYOUT.SM)}>
								{hasCloudBackups && (
									<Typography color={theme.palette.text.secondary}>
										{t("pages.settings.form.connect.backup.existingBackups")}
									</Typography>
								)}
								<Stack
									direction="row"
									gap={theme.spacing(LAYOUT.SM)}
								>
									{!hasCloudBackups && (
										<TipButton
											tip={t("pages.settings.form.connect.tooltips.generateKey")}
											variant="contained"
											disabled={generatingKey}
											onClick={() => void generateKey(false)}
										>
											{t("pages.settings.form.connect.backup.generateKey")}
										</TipButton>
									)}
									<TipButton
										tip={t("pages.settings.form.connect.tooltips.importKey")}
										variant={hasCloudBackups ? "contained" : "outlined"}
										disabled={busy}
										onClick={() => {
											setConfirmLostKey(false);
											setShowKeyImport(true);
										}}
									>
										{t("pages.settings.form.connect.backup.importKey")}
									</TipButton>
									{hasCloudBackups && (
										<TipButton
											tip={t("pages.settings.form.connect.tooltips.lostKey")}
											variant="outlined"
											disabled={generatingKey}
											onClick={() => void handleLostKey()}
										>
											{t(
												confirmLostKey
													? "pages.settings.form.connect.clickToConfirm"
													: "pages.settings.form.connect.backup.lostKey"
											)}
										</TipButton>
									)}
								</Stack>
								{confirmLostKey && (
									<Typography color={theme.palette.error.main}>
										{t("pages.settings.form.connect.backup.lostKeyWarning")}
									</Typography>
								)}
							</Stack>
						)}
						{recoveryKeySet && toolsReady && (
							<>
								<Stack
									direction="row"
									gap={theme.spacing(LAYOUT.SM)}
								>
									<TipButton
										tip={t("pages.settings.form.connect.tooltips.runFull")}
										variant="contained"
										disabled={!isSuperAdmin || busy || startingBackup}
										onClick={() => void runBackup("full")}
									>
										{t("pages.settings.form.connect.backup.runFull")}
									</TipButton>
									<TipButton
										tip={t("pages.settings.form.connect.tooltips.runConfig")}
										variant="outlined"
										disabled={!isSuperAdmin || busy || startingBackup}
										onClick={() => void runBackup("config")}
									>
										{t("pages.settings.form.connect.backup.runConfig")}
									</TipButton>
								</Stack>
								{canReplaceKey && showKeyImport && (
									<RecoveryKeyImportForm
										replaceExisting
										busy={busy}
										lastVerify={lastVerify}
										onQueued={onQueued}
										onKeyChanged={onKeyChanged}
										onClose={() => setShowKeyImport(false)}
									/>
								)}
								{canReplaceKey && !showKeyImport && (
									<TipButton
										tip={t("pages.settings.form.connect.tooltips.replaceKey")}
										variant="text"
										disabled={busy}
										onClick={() => setShowKeyImport(true)}
									>
										{t("pages.settings.form.connect.backup.replaceKey")}
									</TipButton>
								)}
								{lastBackup && (
									<Typography
										color={
											lastBackup.ok
												? theme.palette.text.primary
												: theme.palette.error.main
										}
									>
										{lastBackupText(lastBackup)}
									</Typography>
								)}
								{lastRestore && (
									<Typography
										color={
											lastRestore.ok
												? theme.palette.text.primary
												: theme.palette.error.main
										}
									>
										{lastRestoreText(lastRestore)}
									</Typography>
								)}
								{isSuperAdmin && (
									<ConnectRestoreList
										backups={backups}
										busy={busy}
										onQueued={onQueued}
									/>
								)}
							</>
						)}
					</Stack>
				}
			/>
			<RecoveryKeyDialog
				recoveryKey={recoveryKey}
				onStored={() => setRecoveryKey(null)}
			/>
		</>
	);
};
