import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import type { ComponentProps } from "react";
import { ConfigBox, Tooltip } from "@/Components/design-elements";
import {
	Button,
	Checkbox,
	Dialog,
	Select,
	SwitchComponent as Switch,
	TextField,
} from "@/Components/inputs";
import { useGet, usePost } from "@/Hooks/UseApi";
import { useFormatDate } from "@/Hooks/useFormatDate";
import { useIsSuperAdmin } from "@/Hooks/useIsAdmin";
import { LAYOUT } from "@/Utils/Theme/constants";

// The span keeps the tooltip working while the button is disabled.
const TipButton = ({
	tip,
	...props
}: ComponentProps<typeof Button> & { tip: string }) => (
	<Tooltip title={tip}>
		<span style={{ display: "inline-flex" }}>
			<Button {...props} />
		</span>
	</Tooltip>
);

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

type BackupProgress = {
	operation: "backup" | "restore" | "verify";
	stage: "dumping" | "uploading" | "saving" | "downloading" | "decrypting" | "restoring";
	percent: number | null;
	bytes: number | null;
	attempt: number | null;
	attempts: number | null;
};

type BackupStatus = {
	running: boolean;
	restoring: boolean;
	verifying?: boolean;
	scheduledRunning?: boolean;
	progress?: BackupProgress | null;
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
	restorable?: boolean;
	expiresAt?: string | null;
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
			{!canManage && (
				<Typography>{t("pages.settings.form.connect.superadminOnly")}</Typography>
			)}
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
								<Typography>
									{t("pages.settings.form.connect.status.agentId")}: {status.agentId}
								</Typography>
								{status.tunnel?.lastConnectedAt && (
									<Typography>
										{t("pages.settings.form.connect.status.lastConnected")}:{" "}
										{formatDate(status.tunnel.lastConnectedAt, "dateTime")}
									</Typography>
								)}
								{status.tunnel?.lastError && (
									<Typography color="error">{status.tunnel.lastError}</Typography>
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
							<TipButton
								tip={t("pages.settings.form.connect.tooltips.enroll")}
								variant="contained"
								disabled={!parsed || enrolling}
								onClick={handleEnroll}
							>
								{t("pages.settings.form.connect.enroll.button")}
							</TipButton>
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
								<TipButton
									tip={t("pages.settings.form.connect.tooltips.unenroll")}
									variant="contained"
									color="error"
									disabled={unenrolling}
									onClick={handleUnenroll}
								>
									{confirmUnenroll
										? t("pages.settings.form.connect.unenroll.confirm")
										: t("pages.settings.form.connect.unenroll.button")}
								</TipButton>
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
	} | null;
	refetchStatus: () => Promise<unknown>;
};

const INTERVAL_OPTIONS = [6, 12, 24, 72, 168];
const IDLE_POLL_MS = 5000;
const BUSY_POLL_MS = 1500;

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
	const [keyCopied, setKeyCopied] = useState(false);
	const [keyStep, setKeyStep] = useState<"show" | "verify">("show");
	const [keyCheck, setKeyCheck] = useState("");
	const [keyAcknowledged, setKeyAcknowledged] = useState(false);
	const [keyStoredError, setKeyStoredError] = useState<string | null>(null);
	const [confirmLostKey, setConfirmLostKey] = useState(false);
	const [showKeyImport, setShowKeyImport] = useState(false);
	const [keyInput, setKeyInput] = useState("");
	const keyInputValid = /^[a-fA-F0-9]{64}$/.test(keyInput.trim());
	const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);

	const { post: postImportKey, loading: importingKey } = usePost<
		{ recoveryKey: string; replaceExisting: boolean },
		ConnectStatus
	>();
	const { data: backupStatus, refetch: refetchBackupStatus } = useGet<BackupStatus>(
		"/connect/backup/status",
		{},
		{
			refreshInterval: (latest) =>
				importingKey || latest?.data?.progress || latest?.data?.scheduledRunning
					? BUSY_POLL_MS
					: IDLE_POLL_MS,
		}
	);
	const { data: backupList } = useGet<{ backups: BackupListEntry[] }>(
		"/connect/backup/list",
		{},
		{ refreshInterval: 30000 }
	);
	const { post: postKey, loading: generatingKey } = usePost<
		{ discardExisting: boolean },
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

	const busy =
		backupStatus?.running ||
		backupStatus?.restoring ||
		backupStatus?.verifying ||
		backupStatus?.scheduledRunning ||
		importingKey;
	const toolsReady = (backupStatus?.missingTools?.length ?? 0) === 0;
	const backupsUsable = recoveryKeySet && toolsReady;

	// The server never shows this key again, so a reload here would lose it.
	useEffect(() => {
		if (recoveryKey === null) return;
		const warn = (event: BeforeUnloadEvent) => event.preventDefault();
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, [recoveryKey]);

	const handleGenerateKey = async (discardExisting = false) => {
		const result = await postKey("/connect/backup/recovery-key", { discardExisting });
		if (result?.success && result.data?.recoveryKey) {
			setRecoveryKey(result.data.recoveryKey);
			await refetchStatus();
		}
	};

	const handleLostKey = async () => {
		if (!confirmLostKey) {
			setConfirmLostKey(true);
			return;
		}
		setConfirmLostKey(false);
		await handleGenerateKey(true);
	};

	// The clipboard API only exists on secure pages, and self-hosted installs are
	// often plain http. The key stays selectable in the field either way.
	const handleCopyKey = async () => {
		if (!recoveryKey || !navigator.clipboard) return;
		try {
			await navigator.clipboard.writeText(recoveryKey);
			setKeyCopied(true);
		} catch {
			setKeyCopied(false);
		}
	};

	const handleCancelImport = () => {
		setShowKeyImport(false);
		setKeyInput("");
	};

	const handleImportKey = async () => {
		const result = await postImportKey("/connect/backup/recovery-key/import", {
			recoveryKey: keyInput.trim(),
			replaceExisting: recoveryKeySet,
		});
		if (result?.success) {
			handleCancelImport();
			await refetchStatus();
		}
	};

	// Step two must be pasted from wherever the key was saved, not from the
	// clipboard. Plain http pages have no clipboard API, so they use a copy event.
	const overwriteClipboard = async () => {
		try {
			await navigator.clipboard.writeText(" ");
		} catch {
			const replace = (event: ClipboardEvent) => {
				event.clipboardData?.setData("text/plain", " ");
				event.preventDefault();
			};
			document.addEventListener("copy", replace);
			document.execCommand("copy");
			document.removeEventListener("copy", replace);
		}
	};

	const handleKeyContinue = () => {
		void overwriteClipboard();
		setKeyCopied(false);
		setKeyStep("verify");
	};

	const handleKeyBack = () => {
		setKeyStep("show");
		setKeyCheck("");
		setKeyStoredError(null);
	};

	const handleKeyStored = () => {
		if (keyCheck.trim().toLowerCase() !== recoveryKey?.toLowerCase()) {
			setKeyStoredError(t("pages.settings.form.connect.backup.keyMismatch"));
			return;
		}
		if (!keyAcknowledged) {
			setKeyStoredError(t("pages.settings.form.connect.backup.keyAckRequired"));
			return;
		}
		setRecoveryKey(null);
		setKeyCopied(false);
		setKeyStep("show");
		setKeyCheck("");
		setKeyAcknowledged(false);
		setKeyStoredError(null);
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
	const hasCloudBackups = backups.length > 0;

	const progressText = (() => {
		const progress = backupStatus?.progress;
		if (!progress) {
			if (importingKey) return t("pages.settings.form.connect.backup.progress.checking");
			return backupStatus?.scheduledRunning
				? t("pages.settings.form.connect.backup.progress.scheduled")
				: null;
		}
		const { operation, stage, percent, bytes, attempt, attempts } = progress;
		const text = t(`pages.settings.form.connect.backup.progress.${operation}.${stage}`, {
			attempt,
			attempts,
		});
		if (percent !== null) return `${text} (${percent}%)`;
		return bytes ? `${text} (${formatMb(bytes)})` : text;
	})();

	const keyImportForm = (
		<Stack
			gap={theme.spacing(LAYOUT.SM)}
			width="100%"
		>
			<Typography>
				{t(
					recoveryKeySet
						? "pages.settings.form.connect.backup.replaceKeyHelp"
						: "pages.settings.form.connect.backup.importKeyHelp"
				)}
			</Typography>
			{recoveryKeySet && (
				<Typography color="error">
					{t("pages.settings.form.connect.backup.replaceKeyWarning")}
				</Typography>
			)}
			<TextField
				fullWidth
				type="password"
				autoComplete="off"
				value={keyInput}
				onChange={(e) => setKeyInput(e.target.value)}
				placeholder={t("pages.settings.form.connect.backup.importKeyPlaceholder")}
			/>
			<Stack
				direction="row"
				gap={theme.spacing(LAYOUT.SM)}
			>
				<TipButton
					tip={t("pages.settings.form.connect.tooltips.useKey")}
					variant="contained"
					disabled={!keyInputValid || busy}
					onClick={handleImportKey}
				>
					{t("pages.settings.form.connect.backup.importKeyConfirm")}
				</TipButton>
				<Button
					variant="outlined"
					disabled={importingKey}
					onClick={handleCancelImport}
				>
					{t("pages.settings.form.connect.backup.importKeyCancel")}
				</Button>
			</Stack>
		</Stack>
	);

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
						{progressText && <Typography role="status">{progressText}</Typography>}
						{!recoveryKeySet &&
							!recoveryKey &&
							canManage &&
							toolsReady &&
							(showKeyImport ? (
								keyImportForm
							) : (
								<Stack gap={theme.spacing(LAYOUT.SM)}>
									{hasCloudBackups && (
										<Typography>
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
												onClick={() => void handleGenerateKey()}
											>
												{t("pages.settings.form.connect.backup.generateKey")}
											</TipButton>
										)}
										<TipButton
											tip={t("pages.settings.form.connect.tooltips.importKey")}
											variant={hasCloudBackups ? "contained" : "outlined"}
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
												{confirmLostKey
													? t("pages.settings.form.connect.backup.lostKeyConfirm")
													: t("pages.settings.form.connect.backup.lostKey")}
											</TipButton>
										)}
									</Stack>
									{confirmLostKey && (
										<Typography color="error">
											{t("pages.settings.form.connect.backup.lostKeyWarning")}
										</Typography>
									)}
								</Stack>
							))}
						{backupsUsable && (
							<>
								<Stack
									direction="row"
									gap={theme.spacing(LAYOUT.SM)}
								>
									<TipButton
										tip={t("pages.settings.form.connect.tooltips.runFull")}
										variant="contained"
										disabled={!canManage || busy || startingBackup}
										onClick={() => void handleRun("full")}
									>
										{t("pages.settings.form.connect.backup.runFull")}
									</TipButton>
									<TipButton
										tip={t("pages.settings.form.connect.tooltips.runConfig")}
										variant="outlined"
										disabled={!canManage || busy || startingBackup}
										onClick={() => void handleRun("config")}
									>
										{t("pages.settings.form.connect.backup.runConfig")}
									</TipButton>
								</Stack>
								{canManage &&
									hasCloudBackups &&
									(showKeyImport ? (
										keyImportForm
									) : (
										<TipButton
											tip={t("pages.settings.form.connect.tooltips.replaceKey")}
											variant="text"
											disabled={busy}
											onClick={() => setShowKeyImport(true)}
										>
											{t("pages.settings.form.connect.backup.replaceKey")}
										</TipButton>
									))}
								{last && (
									<Typography color={last.ok ? undefined : "error"}>
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
									<Typography color={lastRestore.ok ? undefined : "error"}>
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
							<Stack
								direction="row"
								alignItems="center"
								gap={theme.spacing(LAYOUT.SM)}
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
								<Typography>
									{schedule?.enabled
										? t("pages.settings.form.connect.backup.schedule.enabled")
										: t("pages.settings.form.connect.backup.schedule.disabled")}
								</Typography>
							</Stack>
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
							<Typography>
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
										<Typography minWidth={170}>
											{formatDate(b.createdAt, "dateTime")}
										</Typography>
										<Chip
											size="small"
											label={b.kind}
										/>
										<Typography minWidth={80}>{formatMb(b.sizeBytes)}</Typography>
										{b.restorable === false && (
											<Chip
												size="small"
												label={t(
													"pages.settings.form.connect.backup.restore.differentKey"
												)}
											/>
										)}
										{b.expiresAt && (
											<Typography>
												{t("pages.settings.form.connect.backup.restore.expires", {
													date: formatDate(b.expiresAt, "dateTime"),
												})}
											</Typography>
										)}
										<TipButton
											tip={t("pages.settings.form.connect.tooltips.restore")}
											variant="outlined"
											color="error"
											disabled={busy || startingRestore || b.restorable === false}
											onClick={() => void handleRestore(b.id)}
										>
											{confirmRestoreId === b.id
												? t("pages.settings.form.connect.backup.restore.confirm")
												: t("pages.settings.form.connect.backup.restore.button")}
										</TipButton>
									</Stack>
								))}
							</Stack>
						)
					}
				/>
			)}
			{/* Dialog passes a click event from its left button and nothing for Escape.
			    Only the click acts, and nothing dismisses this until the key is confirmed.
			    The second step hides the key, so it can only be pasted back from where it was saved. */}
			<Dialog
				open={recoveryKey !== null}
				title={t("pages.settings.form.connect.backup.keyTitle")}
				maxWidth="sm"
				fullWidth
				cancelText={
					keyStep === "verify"
						? t("pages.settings.form.connect.backup.keyShowAgain")
						: keyCopied
							? t("pages.settings.form.connect.backup.keyCopied")
							: t("pages.settings.form.connect.backup.keyCopy")
				}
				onCancel={(event) => {
					if (!event) return;
					if (keyStep === "verify") handleKeyBack();
					else void handleCopyKey();
				}}
				confirmText={
					keyStep === "verify"
						? t("pages.settings.form.connect.backup.keyDone")
						: t("pages.settings.form.connect.backup.keyContinue")
				}
				onConfirm={keyStep === "verify" ? handleKeyStored : handleKeyContinue}
			>
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					<Typography color="error">
						{t("pages.settings.form.connect.backup.keyWarning")}
					</Typography>
					{keyStep === "show" ? (
						<TextField
							fullWidth
							value={recoveryKey ?? ""}
							slotProps={{ input: { readOnly: true } }}
						/>
					) : (
						<>
							<Typography>
								{t("pages.settings.form.connect.backup.keyVerifyHelp")}
							</Typography>
							<TextField
								fullWidth
								autoComplete="off"
								value={keyCheck}
								placeholder={t("pages.settings.form.connect.backup.importKeyPlaceholder")}
								onChange={(event) => {
									setKeyCheck(event.target.value);
									setKeyStoredError(null);
								}}
							/>
							<FormControlLabel
								control={
									<Checkbox
										checked={keyAcknowledged}
										onChange={(event) => {
											setKeyAcknowledged(event.target.checked);
											setKeyStoredError(null);
										}}
									/>
								}
								label={t("pages.settings.form.connect.backup.keyAcknowledge")}
							/>
							{keyStoredError && <Typography color="error">{keyStoredError}</Typography>}
						</>
					)}
				</Stack>
			</Dialog>
		</>
	);
};

export default ConnectSettings;
