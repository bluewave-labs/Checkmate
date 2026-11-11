import { useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import prettyBytes from "pretty-bytes";
import { ConfigBox } from "@/Components/design-elements";
import { useGet, usePost } from "@/Hooks/UseApi";
import { useFormatDate } from "@/Hooks/useFormatDate";
import { useIsSuperAdmin } from "@/Hooks/useIsAdmin";
import { LAYOUT } from "@/Utils/Theme/constants";
import type {
	ConnectBackupKind,
	ConnectBackupList,
	ConnectBackupResult,
	ConnectBackupStatus,
	ConnectGenerateKeyBody,
	ConnectQueued,
	ConnectRecoveryKey,
	ConnectRunBackupBody,
} from "@/Types/Connect";
import { ConnectToolsMissing } from "./ConnectToolsMissing";
import { RecoveryKeyDialog } from "./RecoveryKeyDialog";
import { TipButton } from "./TipButton";

const IDLE_POLL_MS = 5000;
const BUSY_POLL_MS = 1500;
const LIST_POLL_MS = 30000;

export const ConnectBackupBox = ({
	recoveryKeySet,
	onKeyCreated,
}: {
	recoveryKeySet: boolean;
	onKeyCreated: () => Promise<unknown>;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const formatDate = useFormatDate();
	const isSuperAdmin = useIsSuperAdmin();
	const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
	const [confirmLostKey, setConfirmLostKey] = useState(false);

	const { data: backupStatus, refetch: refetchBackupStatus } =
		useGet<ConnectBackupStatus>("/connect/backup/status", undefined, {
			refreshInterval: (latest) => (latest?.data.operation ? BUSY_POLL_MS : IDLE_POLL_MS),
		});
	const { data: backupList } = useGet<ConnectBackupList>(
		"/connect/backup/list",
		undefined,
		{
			refreshInterval: LIST_POLL_MS,
		}
	);
	const { post: postKey, loading: generatingKey } = usePost<
		ConnectGenerateKeyBody,
		ConnectRecoveryKey
	>();
	const { post: postRun, loading: startingBackup } = usePost<
		ConnectRunBackupBody,
		ConnectQueued
	>();

	const toolsReady = (backupStatus?.missingTools.length ?? 0) === 0;
	const busy = (backupStatus?.operation ?? null) !== null;
	const hasCloudBackups = (backupList?.backups.length ?? 0) > 0;
	const lastBackup = backupStatus?.lastBackup ?? null;

	const generateKey = async (discardExisting: boolean) => {
		const result = await postKey("/connect/backup/recovery-key", { discardExisting });
		if (!result?.success) return;
		setRecoveryKey(result.data.recoveryKey);
		await onKeyCreated();
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
		await refetchBackupStatus();
	};

	const progressText = (): string | null => {
		const progress = backupStatus?.progress ?? null;
		if (!progress) {
			if (backupStatus?.operation?.state !== "queued") return null;
			return t("pages.settings.form.connect.backup.progress.queued");
		}
		const step = t(
			`pages.settings.form.connect.backup.progress.${progress.operation}.${progress.stage}`
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
						{!recoveryKeySet && !recoveryKey && isSuperAdmin && toolsReady && (
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
									{hasCloudBackups && (
										<TipButton
											tip={t("pages.settings.form.connect.tooltips.lostKey")}
											variant="outlined"
											disabled={generatingKey}
											onClick={() => void handleLostKey()}
										>
											{t(
												confirmLostKey
													? "pages.settings.form.connect.backup.lostKeyConfirm"
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
