import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { ConfigBox } from "@/Components/design-elements";
import {
	Button,
	Select,
	SwitchComponent as Switch,
	TextField,
} from "@/Components/inputs";
import { useGet, usePost } from "@/Hooks/UseApi";
import { useFormatDate } from "@/Hooks/useFormatDate";
import { useIsSuperAdmin } from "@/Hooks/useIsAdmin";
import { LAYOUT } from "@/Utils/Theme/constants";

type ConnectStatus = {
	enrolled?: boolean;
	agentId?: string | null;
	connectUrl?: string | null;
	remoteAccess?: { enabled: boolean };
	apiUrl?: string | null;
	backup?: {
		recoveryKeySet: boolean;
		schedule: {
			enabled: boolean;
			intervalHours: number;
			kind: "full" | "config";
			lastStartedAt: string | null;
		} | null;
	};
	tunnel?: {
		connected: boolean;
		enabled: boolean;
		lastConnectedAt: string | null;
		lastError: string | null;
	};
	agentVersion?: string;
};

type EnrollBody = { connectUrl: string; agentId: string; token: string; apiUrl?: string };

type BackupStatus = {
	running: boolean;
	restoring: boolean;
	lastResult: {
		ok: boolean;
		at: string;
		kind: string;
		sizeBytes?: number;
		error?: string;
	} | null;
	lastRestore: { ok: boolean; at: string; backupId: string; error?: string } | null;
	missingTools?: string[];
};

type BackupListEntry = {
	id: string;
	kind: string;
	sizeBytes: number;
	status: string;
	createdAt: string;
};

const parseCredentialBlock = (raw: string): EnrollBody | null => {
	const fields: Record<string, string> = {};
	for (const line of raw.split(/\r?\n/)) {
		const match = line
			.trim()
			.match(/^(CONNECT_URL|CONNECT_AGENT|CONNECT_TOKEN|CONNECT_API)=(.+)$/);
		if (match) fields[match[1]] = match[2].trim();
	}
	if (!fields.CONNECT_URL || !fields.CONNECT_AGENT || !fields.CONNECT_TOKEN) return null;
	return {
		connectUrl: fields.CONNECT_URL,
		agentId: fields.CONNECT_AGENT,
		token: fields.CONNECT_TOKEN,
		// Optional in pre-0.4.0 credential blocks (ADR-002).
		...(fields.CONNECT_API ? { apiUrl: fields.CONNECT_API } : {}),
	};
};

const formatMb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

const ConnectSettings = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const formatDate = useFormatDate();
	const canManage = useIsSuperAdmin();
	const [credentialBlock, setCredentialBlock] = useState("");
	const [confirmUnenroll, setConfirmUnenroll] = useState(false);

	const { data: status, refetch } = useGet<ConnectStatus>(
		"/connect/status",
		{},
		{ refreshInterval: 5000 }
	);
	const { post: postEnroll, loading: enrolling } = usePost<EnrollBody, ConnectStatus>();
	const { post: postRemoteAccess, loading: togglingRemote } = usePost<
		{ enabled: boolean },
		ConnectStatus
	>();
	const { post: postUnenroll, loading: unenrolling } = usePost<
		Record<string, never>,
		ConnectStatus
	>();

	const parsed = parseCredentialBlock(credentialBlock);

	const handleEnroll = async () => {
		if (!parsed) return;
		const result = await postEnroll("/connect/enroll", parsed);
		if (result?.success) {
			setCredentialBlock("");
			await refetch();
		}
	};

	const handleRemoteAccess = async (enabled: boolean) => {
		const result = await postRemoteAccess("/connect/remote-access", { enabled });
		if (result?.success) await refetch();
	};

	const handleUnenroll = async () => {
		if (!confirmUnenroll) {
			setConfirmUnenroll(true);
			return;
		}
		setConfirmUnenroll(false);
		const result = await postUnenroll("/connect/unenroll", {});
		if (result?.success) await refetch();
	};

	if (!status) {
		return null;
	}

	const tunnelConnected = status.tunnel?.connected ?? false;
	const getTunnelLabel = () => {
		if (tunnelConnected) return t("pages.settings.form.connect.status.connected");
		if (!status.remoteAccess?.enabled) {
			return t("pages.settings.form.connect.status.remoteAccessOff");
		}
		return status.tunnel?.lastError
			? t("pages.settings.form.connect.status.disconnected")
			: t("pages.settings.form.connect.status.connecting");
	};

	return (
		<Stack gap={theme.spacing(LAYOUT.MD)}>
			<ConfigBox
				title={t("pages.settings.form.connect.status.title")}
				subtitle={t("pages.settings.form.connect.status.description")}
				rightContent={
					<Stack
						gap={theme.spacing(LAYOUT.SM)}
						alignItems="flex-start"
					>
						<Stack
							direction="row"
							gap={theme.spacing(LAYOUT.SM)}
						>
							<Chip
								size="small"
								color={status.enrolled ? "success" : "default"}
								label={
									status.enrolled
										? t("pages.settings.form.connect.status.enrolled")
										: t("pages.settings.form.connect.status.notEnrolled")
								}
							/>
							{status.enrolled && (
								<Chip
									size="small"
									color={tunnelConnected ? "success" : "default"}
									label={getTunnelLabel()}
								/>
							)}
						</Stack>
						{status.enrolled && (
							<>
								<Typography variant="body2">
									{t("pages.settings.form.connect.status.agentId")}: {status.agentId}
								</Typography>
								{status.tunnel?.lastConnectedAt && (
									<Typography variant="body2">
										{t("pages.settings.form.connect.status.lastConnected")}:{" "}
										{formatDate(status.tunnel.lastConnectedAt, "dateTime")}
									</Typography>
								)}
								{status.tunnel?.lastError && (
									<Typography
										variant="body2"
										color="error"
									>
										{status.tunnel.lastError}
									</Typography>
								)}
							</>
						)}
					</Stack>
				}
			/>

			{!status.enrolled && canManage && (
				<ConfigBox
					title={t("pages.settings.form.connect.enroll.title")}
					subtitle={t("pages.settings.form.connect.enroll.description")}
					rightContent={
						<Stack
							gap={theme.spacing(LAYOUT.SM)}
							alignItems="flex-start"
						>
							<TextField
								fullWidth
								multiline
								minRows={3}
								value={credentialBlock}
								onChange={(e) => setCredentialBlock(e.target.value)}
								placeholder={
									"CONNECT_URL=wss://...\nCONNECT_AGENT=inst-...\nCONNECT_TOKEN=cmk_..."
								}
							/>
							<Button
								variant="contained"
								disabled={!parsed || enrolling}
								onClick={handleEnroll}
							>
								{t("pages.settings.form.connect.enroll.button")}
							</Button>
						</Stack>
					}
				/>
			)}

			{status.enrolled && (
				<>
					<BackupSection
						recoveryKeySet={status.backup?.recoveryKeySet ?? false}
						schedule={status.backup?.schedule ?? null}
						refetchStatus={refetch}
					/>
					<ConfigBox
						title={t("pages.settings.form.connect.remoteAccess.title")}
						subtitle={t("pages.settings.form.connect.remoteAccess.description")}
						rightContent={
							<Switch
								checked={status.remoteAccess?.enabled ?? false}
								disabled={togglingRemote}
								onChange={(_, checked) => void handleRemoteAccess(checked)}
							/>
						}
					/>
					{canManage && (
						<ConfigBox
							title={t("pages.settings.form.connect.unenroll.title")}
							subtitle={t("pages.settings.form.connect.unenroll.description")}
							rightContent={
								<Button
									variant="contained"
									color="error"
									disabled={unenrolling}
									onClick={handleUnenroll}
								>
									{confirmUnenroll
										? t("pages.settings.form.connect.unenroll.confirm")
										: t("pages.settings.form.connect.unenroll.button")}
								</Button>
							}
						/>
					)}
				</>
			)}
		</Stack>
	);
};

type BackupSectionProps = {
	recoveryKeySet: boolean;
	schedule: {
		enabled: boolean;
		intervalHours: number;
		kind: "full" | "config";
		lastStartedAt: string | null;
	} | null;
	refetchStatus: () => Promise<unknown>;
};

const INTERVAL_OPTIONS = [6, 12, 24, 72, 168];

const BackupSection = ({
	recoveryKeySet,
	schedule,
	refetchStatus,
}: BackupSectionProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const formatDate = useFormatDate();
	const canManage = useIsSuperAdmin();
	const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
	const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);

	const { data: backupStatus, refetch: refetchBackupStatus } = useGet<BackupStatus>(
		"/connect/backup/status",
		{},
		{ refreshInterval: 5000 }
	);
	const { data: backupList } = useGet<{ backups: BackupListEntry[] }>(
		"/connect/backup/list",
		{},
		{ refreshInterval: 30000 }
	);
	const { post: postKey, loading: generatingKey } = usePost<
		Record<string, never>,
		{ recoveryKey: string }
	>();
	const { post: postRun, loading: startingBackup } = usePost<{ kind: string }, unknown>();
	const { post: postRestore, loading: startingRestore } = usePost<
		{ backupId: string },
		unknown
	>();
	const { post: postSchedule, loading: savingSchedule } = usePost<
		{ enabled: boolean; intervalHours?: number; kind?: string },
		ConnectStatus
	>();

	const busy = backupStatus?.running || backupStatus?.restoring;
	const toolsReady = (backupStatus?.missingTools?.length ?? 0) === 0;
	const backupsUsable = recoveryKeySet && toolsReady;

	const handleGenerateKey = async () => {
		const result = await postKey("/connect/backup/recovery-key", {});
		if (result?.success && result.data?.recoveryKey) {
			setRecoveryKey(result.data.recoveryKey);
			await refetchStatus();
		}
	};

	const handleRun = async (kind: "full" | "config") => {
		const result = await postRun("/connect/backup/run", { kind });
		if (result?.success) await refetchBackupStatus();
	};

	const handleRestore = async (backupId: string) => {
		if (confirmRestoreId !== backupId) {
			setConfirmRestoreId(backupId);
			return;
		}
		setConfirmRestoreId(null);
		const result = await postRestore("/connect/backup/restore", { backupId });
		if (result?.success) await refetchBackupStatus();
	};

	const handleSchedule = async (body: {
		enabled: boolean;
		intervalHours?: number;
		kind?: string;
	}) => {
		const result = await postSchedule("/connect/backup/schedule", body);
		if (result?.success) await refetchStatus();
	};

	const last = backupStatus?.lastResult;
	const lastRestore = backupStatus?.lastRestore;
	const backups = backupList?.backups ?? [];

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
						{!toolsReady && (
							<>
								<Typography color="error">
									{t("pages.settings.form.connect.backup.toolsMissing")}
								</Typography>
								<Typography>
									{t("pages.settings.form.connect.backup.toolsMac")}
								</Typography>
								<Link
									href="https://www.mongodb.com/try/download/database-tools"
									target="_blank"
									rel="noopener noreferrer"
								>
									{t("pages.settings.form.connect.backup.toolsLink")}
								</Link>
								<Typography>
									{t("pages.settings.form.connect.backup.toolsPath")}
								</Typography>
							</>
						)}
						{!recoveryKeySet && !recoveryKey && canManage && toolsReady && (
							<Button
								variant="contained"
								disabled={generatingKey}
								onClick={handleGenerateKey}
							>
								{t("pages.settings.form.connect.backup.generateKey")}
							</Button>
						)}
						{recoveryKey && (
							<>
								<Typography
									variant="body2"
									color="error"
								>
									{t("pages.settings.form.connect.backup.keyWarning")}
								</Typography>
								<TextField
									fullWidth
									value={recoveryKey}
									slotProps={{ input: { readOnly: true } }}
								/>
								<Stack
									direction="row"
									gap={theme.spacing(LAYOUT.SM)}
								>
									<Button
										variant="outlined"
										onClick={() => void navigator.clipboard.writeText(recoveryKey)}
									>
										{t("pages.settings.form.connect.backup.keyCopy")}
									</Button>
									<Button
										variant="contained"
										onClick={() => setRecoveryKey(null)}
									>
										{t("pages.settings.form.connect.backup.keyDone")}
									</Button>
								</Stack>
							</>
						)}
						{backupsUsable && (
							<>
								<Stack
									direction="row"
									gap={theme.spacing(LAYOUT.SM)}
								>
									<Button
										variant="contained"
										disabled={!canManage || busy || startingBackup}
										onClick={() => void handleRun("full")}
									>
										{t("pages.settings.form.connect.backup.runFull")}
									</Button>
									<Button
										variant="outlined"
										disabled={!canManage || busy || startingBackup}
										onClick={() => void handleRun("config")}
									>
										{t("pages.settings.form.connect.backup.runConfig")}
									</Button>
								</Stack>
								{backupStatus?.running && (
									<Typography variant="body2">
										{t("pages.settings.form.connect.backup.running")}
									</Typography>
								)}
								{backupStatus?.restoring && (
									<Typography variant="body2">
										{t("pages.settings.form.connect.backup.restoring")}
									</Typography>
								)}
								{last && (
									<Typography
										variant="body2"
										color={last.ok ? undefined : "error"}
									>
										{t("pages.settings.form.connect.backup.lastBackup")} (
										{formatDate(last.at, "dateTime")}):{" "}
										{last.ok
											? `${t("pages.settings.form.connect.backup.succeeded")}${
													last.sizeBytes ? ` · ${formatMb(last.sizeBytes)}` : ""
												}`
											: `${t("pages.settings.form.connect.backup.failed")} — ${last.error}`}
									</Typography>
								)}
								{lastRestore && (
									<Typography
										variant="body2"
										color={lastRestore.ok ? undefined : "error"}
									>
										{t("pages.settings.form.connect.backup.lastRestore")} (
										{formatDate(lastRestore.at, "dateTime")}):{" "}
										{lastRestore.ok
											? t("pages.settings.form.connect.backup.succeeded")
											: `${t("pages.settings.form.connect.backup.failed")} — ${lastRestore.error}`}
									</Typography>
								)}
							</>
						)}
					</Stack>
				}
			/>

			{backupsUsable && canManage && (
				<ConfigBox
					title={t("pages.settings.form.connect.backup.schedule.title")}
					subtitle={t("pages.settings.form.connect.backup.schedule.description")}
					rightContent={
						<Stack
							gap={theme.spacing(LAYOUT.SM)}
							alignItems="flex-start"
						>
							<Switch
								checked={schedule?.enabled ?? false}
								disabled={savingSchedule}
								onChange={(_, checked) =>
									void handleSchedule({
										enabled: checked,
										intervalHours: schedule?.intervalHours ?? 24,
										kind: schedule?.kind ?? "full",
									})
								}
							/>
							{schedule?.enabled && (
								<Stack
									direction="row"
									gap={theme.spacing(LAYOUT.SM)}
								>
									<Select
										fieldLabel={t("pages.settings.form.connect.backup.schedule.interval")}
										value={schedule.intervalHours}
										disabled={savingSchedule}
										onChange={(e) =>
											void handleSchedule({
												enabled: true,
												intervalHours: Number(e.target.value),
												kind: schedule.kind,
											})
										}
									>
										{INTERVAL_OPTIONS.map((h) => (
											<MenuItem
												key={h}
												value={h}
											>
												{h} {t("pages.settings.form.connect.backup.schedule.hours")}
											</MenuItem>
										))}
									</Select>
									<Select
										fieldLabel={t("pages.settings.form.connect.backup.schedule.kind")}
										value={schedule.kind}
										disabled={savingSchedule}
										onChange={(e) =>
											void handleSchedule({
												enabled: true,
												intervalHours: schedule.intervalHours,
												kind: e.target.value,
											})
										}
									>
										<MenuItem value="full">
											{t("pages.settings.form.connect.backup.schedule.kindFull")}
										</MenuItem>
										<MenuItem value="config">
											{t("pages.settings.form.connect.backup.schedule.kindConfig")}
										</MenuItem>
									</Select>
								</Stack>
							)}
						</Stack>
					}
				/>
			)}

			{backupsUsable && canManage && (
				<ConfigBox
					title={t("pages.settings.form.connect.backup.restore.title")}
					subtitle={t("pages.settings.form.connect.backup.restore.description")}
					rightContent={
						backups.length === 0 ? (
							<Typography variant="body2">
								{t("pages.settings.form.connect.backup.restore.empty")}
							</Typography>
						) : (
							<Stack gap={theme.spacing(LAYOUT.SM)}>
								{backups.map((b) => (
									<Stack
										key={b.id}
										direction="row"
										alignItems="center"
										gap={theme.spacing(LAYOUT.SM)}
									>
										<Typography
											variant="body2"
											minWidth={170}
										>
											{formatDate(b.createdAt, "dateTime")}
										</Typography>
										<Chip
											size="small"
											label={b.kind}
										/>
										<Typography
											variant="body2"
											minWidth={80}
										>
											{formatMb(b.sizeBytes)}
										</Typography>
										<Button
											variant="outlined"
											color="error"
											disabled={busy || startingRestore}
											onClick={() => void handleRestore(b.id)}
										>
											{confirmRestoreId === b.id
												? t("pages.settings.form.connect.backup.restore.confirm")
												: t("pages.settings.form.connect.backup.restore.button")}
										</Button>
									</Stack>
								))}
							</Stack>
						)
					}
				/>
			)}
		</>
	);
};

export default ConnectSettings;
