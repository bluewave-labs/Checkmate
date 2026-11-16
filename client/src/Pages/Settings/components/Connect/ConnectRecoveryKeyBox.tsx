import { useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { ConfigBox } from "@/Components/design-elements";
import { usePost } from "@/Hooks/UseApi";
import { LAYOUT } from "@/Utils/Theme/constants";
import type {
	ConnectBackupStatus,
	ConnectGenerateKeyBody,
	ConnectRecoveryKey,
} from "@/Types/Connect";
import { ConnectOperationStatus } from "./ConnectOperationStatus";
import { RecoveryKeyDialog } from "./RecoveryKeyDialog";
import { RecoveryKeyImportForm } from "./RecoveryKeyImportForm";
import { TipButton } from "./TipButton";

export const ConnectRecoveryKeyBox = ({
	recoveryKeySet,
	backupStatus,
	busy,
	hasCloudBackups,
	onKeyChanged,
	onQueued,
}: {
	recoveryKeySet: boolean;
	backupStatus: ConnectBackupStatus | null;
	busy: boolean;
	hasCloudBackups: boolean;
	onKeyChanged: () => Promise<unknown>;
	onQueued: () => Promise<unknown>;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
	const [confirmLostKey, setConfirmLostKey] = useState(false);
	const [showKeyImport, setShowKeyImport] = useState(false);
	const { post, loading: generatingKey } = usePost<
		ConnectGenerateKeyBody,
		ConnectRecoveryKey
	>();
	const lastVerify = backupStatus?.lastVerify ?? null;
	const settingUp = !recoveryKeySet && !recoveryKey;

	const generateKey = async (discardExisting: boolean) => {
		const result = await post("/connect/backup/recovery-key", { discardExisting });
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

	return (
		<>
			<ConfigBox
				title={t("pages.settings.form.connect.recoveryKey.title")}
				subtitle={t("pages.settings.form.connect.recoveryKey.description")}
				rightContent={
					<Stack
						gap={theme.spacing(LAYOUT.SM)}
						alignItems="flex-start"
					>
						<ConnectOperationStatus
							operation="verify"
							backupStatus={backupStatus}
							hideIdle
						/>
						{showKeyImport && (
							<RecoveryKeyImportForm
								replaceExisting={recoveryKeySet}
								busy={busy}
								lastVerify={lastVerify}
								onQueued={onQueued}
								onKeyChanged={onKeyChanged}
								onClose={() => setShowKeyImport(false)}
							/>
						)}
						{settingUp && !showKeyImport && hasCloudBackups && (
							<Typography color={theme.palette.text.secondary}>
								{t("pages.settings.form.connect.backup.existingBackups")}
							</Typography>
						)}
						{settingUp && !showKeyImport && (
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
						)}
						{settingUp && confirmLostKey && (
							<Typography color={theme.palette.error.main}>
								{t("pages.settings.form.connect.backup.lostKeyWarning")}
							</Typography>
						)}
						{recoveryKeySet && !showKeyImport && (
							<Typography color={theme.palette.text.secondary}>
								{t("pages.settings.form.connect.recoveryKey.set")}
							</Typography>
						)}
						{recoveryKeySet && hasCloudBackups && !showKeyImport && (
							<TipButton
								tip={t("pages.settings.form.connect.tooltips.replaceKey")}
								variant="outlined"
								disabled={busy}
								onClick={() => setShowKeyImport(true)}
							>
								{t("pages.settings.form.connect.backup.replaceKey")}
							</TipButton>
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
