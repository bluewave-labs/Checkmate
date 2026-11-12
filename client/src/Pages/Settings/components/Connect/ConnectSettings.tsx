import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useGet } from "@/Hooks/UseApi";
import { useIsSuperAdmin } from "@/Hooks/useIsAdmin";
import { LAYOUT } from "@/Utils/Theme/constants";
import type {
	ConnectBackupList,
	ConnectBackupStatus,
	ConnectStatus,
} from "@/Types/Connect";
import { ConnectRestoreBox } from "./ConnectRestoreBox";
import { ConnectBackupBox } from "./ConnectBackupBox";
import { ConnectEnrollBox } from "./ConnectEnrollBox";
import { ConnectRemoteAccessBox } from "./ConnectRemoteAccessBox";
import { ConnectStatusBox } from "./ConnectStatusBox";
import { ConnectUnenrollBox } from "./ConnectUnenrollBox";

const IDLE_POLL_MS = 5000;
const BUSY_POLL_MS = 1500;
const LIST_POLL_MS = 30000;

export const ConnectSettings = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const isSuperAdmin = useIsSuperAdmin();
	const { data: status, refetch } = useGet<ConnectStatus>("/connect/status", undefined, {
		refreshInterval: 5000,
	});

	const enrolled = status?.enrolled ?? false;
	const { data: backupStatus, refetch: refetchBackupStatus } =
		useGet<ConnectBackupStatus>(enrolled ? "/connect/backup/status" : null, undefined, {
			refreshInterval: (latest) => (latest?.data.operation ? BUSY_POLL_MS : IDLE_POLL_MS),
		});
	const { data: backupList } = useGet<ConnectBackupList>(
		enrolled ? "/connect/backup/list" : null,
		undefined,
		{ refreshInterval: LIST_POLL_MS }
	);
	const backupBusy = Boolean(backupStatus?.operation);
	const backupToolsReady = (backupStatus?.missingTools.length ?? 0) === 0;
	const cloudBackups = backupList?.backups ?? [];

	if (!status) return null;

	return (
		<Stack gap={theme.spacing(LAYOUT.MD)}>
			{!isSuperAdmin && (
				<Typography color={theme.palette.text.secondary}>
					{t("pages.settings.form.connect.superadminOnly")}
				</Typography>
			)}
			<ConnectStatusBox status={status} />
			{isSuperAdmin && !status.enrolled && <ConnectEnrollBox onEnrolled={refetch} />}
			{status.enrolled && (
				<ConnectBackupBox
					recoveryKeySet={status.backup.recoveryKeySet}
					backupStatus={backupStatus}
					busy={backupBusy}
					toolsReady={backupToolsReady}
					hasCloudBackups={cloudBackups.length > 0}
					onKeyChanged={refetch}
					onQueued={refetchBackupStatus}
				/>
			)}
			{isSuperAdmin &&
				status.enrolled &&
				status.backup.recoveryKeySet &&
				backupToolsReady && (
					<ConnectRestoreBox
						backups={cloudBackups}
						busy={backupBusy}
						onQueued={refetchBackupStatus}
					/>
				)}
			{isSuperAdmin && status.enrolled && (
				<ConnectRemoteAccessBox
					enabled={status.remoteAccess.enabled}
					onChanged={refetch}
				/>
			)}
			{isSuperAdmin && status.enrolled && <ConnectUnenrollBox onUnenrolled={refetch} />}
		</Stack>
	);
};
