import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ConfigBox } from "@/Components/design-elements";
import { useGet, usePost } from "@/Hooks/UseApi";
import { LAYOUT } from "@/Utils/Theme/constants";

type ConnectStatus = {
	available: boolean;
	unreachable?: boolean;
	enrolled?: boolean;
	agentId?: string | null;
	connectUrl?: string | null;
	remoteAccess?: { enabled: boolean };
	watchdog?: { enabled: boolean };
	tunnel?: {
		connected: boolean;
		enabled: boolean;
		lastConnectedAt: string | null;
		lastError: string | null;
	};
	agentVersion?: string;
};

type EnrollBody = { connectUrl: string; agentId: string; token: string };

const parseCredentialBlock = (raw: string): EnrollBody | null => {
	const fields: Record<string, string> = {};
	for (const line of raw.split(/\r?\n/)) {
		const match = line.trim().match(/^(CONNECT_URL|CONNECT_AGENT|CONNECT_TOKEN)=(.+)$/);
		if (match) fields[match[1]] = match[2].trim();
	}
	if (!fields.CONNECT_URL || !fields.CONNECT_AGENT || !fields.CONNECT_TOKEN) return null;
	return {
		connectUrl: fields.CONNECT_URL,
		agentId: fields.CONNECT_AGENT,
		token: fields.CONNECT_TOKEN,
	};
};

const ConnectSettings = () => {
	const { t } = useTranslation();
	const theme = useTheme();
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

	if (!status.available) {
		return (
			<Stack gap={theme.spacing(LAYOUT.MD)}>
				<ConfigBox
					title={t("pages.settings.form.connect.notConfigured.title")}
					subtitle={t("pages.settings.form.connect.notConfigured.description")}
					rightContent={
						<Typography variant="body2">
							{status.unreachable
								? t("pages.settings.form.connect.notConfigured.unreachable")
								: t("pages.settings.form.connect.notConfigured.help")}
						</Typography>
					}
				/>
			</Stack>
		);
	}

	const tunnelConnected = status.tunnel?.connected ?? false;

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
									label={
										tunnelConnected
											? t("pages.settings.form.connect.status.connected")
											: t("pages.settings.form.connect.status.disconnected")
									}
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
										{new Date(status.tunnel.lastConnectedAt).toLocaleString()}
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

			{!status.enrolled && (
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
				</>
			)}
		</Stack>
	);
};

export default ConnectSettings;
