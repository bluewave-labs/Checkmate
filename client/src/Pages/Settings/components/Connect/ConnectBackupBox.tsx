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
	ConnectBackupResult,
	ConnectBackupStatus,
	ConnectQueued,
	ConnectRunBackupBody,
} from "@/Types/Connect";
import { ConnectOperationStatus } from "./ConnectOperationStatus";
import { ConnectToolsMissing } from "./ConnectToolsMissing";
import { TipButton } from "./TipButton";

export const ConnectBackupBox = ({
	recoveryKeySet,
	backupStatus,
	busy,
	toolsReady,
	onQueued,
}: {
	recoveryKeySet: boolean;
	backupStatus: ConnectBackupStatus | null;
	busy: boolean;
	toolsReady: boolean;
	onQueued: () => Promise<unknown>;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const formatDate = useFormatDate();
	const isSuperAdmin = useIsSuperAdmin();
	const { post, loading } = usePost<ConnectRunBackupBody, ConnectQueued>();
	const lastBackup = backupStatus?.lastBackup ?? null;

	const runBackup = async (kind: ConnectBackupKind) => {
		const result = await post("/connect/backup/run", { kind });
		if (!result?.success) return;
		await onQueued();
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

	return (
		<ConfigBox
			title={t("pages.settings.form.connect.backup.title")}
			subtitle={t("pages.settings.form.connect.backup.description")}
			rightContent={
				<Stack
					gap={theme.spacing(LAYOUT.SM)}
					alignItems="flex-start"
				>
					<ConnectOperationStatus
						operation="backup"
						backupStatus={backupStatus}
					/>
					{!toolsReady && <ConnectToolsMissing />}
					{toolsReady && !recoveryKeySet && (
						<Typography color={theme.palette.text.secondary}>
							{t("pages.settings.form.connect.backup.needsKey")}
						</Typography>
					)}
					{toolsReady && recoveryKeySet && (
						<Stack
							direction="row"
							gap={theme.spacing(LAYOUT.SM)}
						>
							<TipButton
								tip={t("pages.settings.form.connect.tooltips.runFull")}
								variant="contained"
								disabled={!isSuperAdmin || busy || loading}
								onClick={() => void runBackup("full")}
							>
								{t("pages.settings.form.connect.backup.runFull")}
							</TipButton>
							<TipButton
								tip={t("pages.settings.form.connect.tooltips.runConfig")}
								variant="outlined"
								disabled={!isSuperAdmin || busy || loading}
								onClick={() => void runBackup("config")}
							>
								{t("pages.settings.form.connect.backup.runConfig")}
							</TipButton>
						</Stack>
					)}
					{lastBackup && (
						<Typography
							color={
								lastBackup.ok ? theme.palette.text.primary : theme.palette.error.main
							}
						>
							{lastBackupText(lastBackup)}
						</Typography>
					)}
				</Stack>
			}
		/>
	);
};
