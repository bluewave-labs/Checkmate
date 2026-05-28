import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { MenuItem, Stack, Typography, useTheme } from "@mui/material";
import { BasePage, ConfigBox } from "@/Components/design-elements";
import { Button, Select, TextField } from "@/Components/inputs";
import { usePost } from "@/Hooks/UseApi";
import type { CaptureAgentDevice, DeviceAuthType, DeviceOS } from "@/Types/CaptureAgent";
import { LAYOUT } from "@/Utils/Theme/constants";

// AddCaptureAgentDevicePage collects the variables the script runner needs
// to address an external host. The password field is transmitted in
// plaintext over the API call and stored as AES-256-GCM ciphertext by the
// server so it can be decrypted at execution time.
const AddCaptureAgentDevicePage = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { agentId } = useParams<{ agentId: string }>();
	const { post, loading } = usePost<Record<string, unknown>, CaptureAgentDevice>();

	const [name, setName] = useState("");
	const [hostname, setHostname] = useState("");
	const [ipAddress, setIpAddress] = useState("");
	const [os, setOs] = useState<DeviceOS>("unknown");
	const [authType, setAuthType] = useState<DeviceAuthType>("none");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [sshKeyFingerprint, setSshKeyFingerprint] = useState("");
	const [port, setPort] = useState<number | "">("");
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validate = (): boolean => {
		const next: Record<string, string> = {};
		if (!name.trim())
			next.name = t("pages.captureAgents.devices.add.errors.name", "Name is required");
		if (!hostname.trim()) {
			next.hostname = t(
				"pages.captureAgents.devices.add.errors.hostname",
				"Hostname is required"
			);
		}
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!validate() || !agentId) return;
		const body: Record<string, unknown> = {
			name: name.trim(),
			hostname: hostname.trim(),
			ipAddress: ipAddress.trim() || undefined,
			os,
			authType,
		};
		if (authType !== "none") {
			if (username.trim()) body.username = username.trim();
			if (password) body.password = password;
			if (port !== "") body.port = port;
			if (authType === "ssh" && sshKeyFingerprint.trim()) {
				body.sshKeyFingerprint = sshKeyFingerprint.trim();
			}
		}
		const res = await post(`/capture-agents/${agentId}/devices`, body);
		if (res?.success) {
			navigate(`/settings/capture-agents/${agentId}/devices`);
		}
	};

	const showSshFields = authType === "ssh";
	const showWinrmFields = authType === "winrm";
	const defaultPort = authType === "ssh" ? 22 : authType === "winrm" ? 5985 : undefined;

	return (
		<BasePage
			component="form"
			onSubmit={handleSubmit}
		>
			<Stack>
				<Typography variant="h4">
					{t("pages.captureAgents.devices.add.title", "Add device")}
				</Typography>
				<Typography color={theme.palette.text.secondary}>
					{t(
						"pages.captureAgents.devices.add.description",
						"Devices feed the %%hostname%%, %%ip%%, and %%devicename%% variables when scripts run."
					)}
				</Typography>
			</Stack>

			<ConfigBox
				title={t("pages.captureAgents.devices.add.identity.title", "Identity")}
				subtitle={t(
					"pages.captureAgents.devices.add.identity.description",
					"How Checkmate addresses this host."
				)}
				rightContent={
					<Stack spacing={theme.spacing(LAYOUT.MD)}>
						<TextField
							fieldLabel={t("pages.captureAgents.devices.add.fields.name", "Name")}
							value={name}
							onChange={(e) => setName(e.target.value)}
							error={Boolean(errors.name)}
							helperText={errors.name ?? ""}
							fullWidth
						/>
						<TextField
							fieldLabel={t(
								"pages.captureAgents.devices.add.fields.hostname",
								"Hostname"
							)}
							value={hostname}
							onChange={(e) => setHostname(e.target.value)}
							error={Boolean(errors.hostname)}
							helperText={errors.hostname ?? ""}
							fullWidth
						/>
						<TextField
							fieldLabel={t("pages.captureAgents.devices.add.fields.ip", "IP address")}
							placeholder={t(
								"pages.captureAgents.devices.add.fields.ipPlaceholder",
								"optional — for %%ip%% variable"
							)}
							value={ipAddress}
							onChange={(e) => setIpAddress(e.target.value)}
							fullWidth
						/>
						<Select
							fieldLabel={t(
								"pages.captureAgents.devices.add.fields.os",
								"Operating system"
							)}
							value={os}
							onChange={(e) => setOs(e.target.value as DeviceOS)}
						>
							<MenuItem value="unknown">
								{t("pages.captureAgents.devices.os.unknown", "Unknown")}
							</MenuItem>
							<MenuItem value="linux">
								{t("pages.captureAgents.devices.os.linux", "Linux")}
							</MenuItem>
							<MenuItem value="windows">
								{t("pages.captureAgents.devices.os.windows", "Windows")}
							</MenuItem>
							<MenuItem value="macos">
								{t("pages.captureAgents.devices.os.macos", "macOS")}
							</MenuItem>
						</Select>
					</Stack>
				}
			/>

			<ConfigBox
				title={t("pages.captureAgents.devices.add.auth.title", "Authentication")}
				subtitle={t(
					"pages.captureAgents.devices.add.auth.description",
					"Choose how the capture agent should authenticate when running a script on this device."
				)}
				rightContent={
					<Stack spacing={theme.spacing(LAYOUT.MD)}>
						<Select
							fieldLabel={t(
								"pages.captureAgents.devices.add.fields.authType",
								"Auth type"
							)}
							value={authType}
							onChange={(e) => setAuthType(e.target.value as DeviceAuthType)}
						>
							<MenuItem value="none">
								{t("pages.captureAgents.devices.auth.none", "None")}
							</MenuItem>
							<MenuItem value="ssh">
								{t("pages.captureAgents.devices.auth.ssh", "SSH")}
							</MenuItem>
							<MenuItem value="winrm">
								{t("pages.captureAgents.devices.auth.winrm", "WinRM")}
							</MenuItem>
						</Select>

						{(showSshFields || showWinrmFields) && (
							<>
								<TextField
									fieldLabel={t(
										"pages.captureAgents.devices.add.fields.username",
										"Username"
									)}
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									fullWidth
								/>
								<TextField
									fieldLabel={t(
										"pages.captureAgents.devices.add.fields.password",
										"Password"
									)}
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									fullWidth
								/>
								<TextField
									fieldLabel={t("pages.captureAgents.devices.add.fields.port", "Port")}
									type="number"
									value={port === "" ? "" : String(port)}
									placeholder={defaultPort ? String(defaultPort) : ""}
									onChange={(e) =>
										setPort(e.target.value === "" ? "" : Number(e.target.value))
									}
									fullWidth
								/>
							</>
						)}

						{showSshFields && (
							<TextField
								fieldLabel={t(
									"pages.captureAgents.devices.add.fields.sshKeyFingerprint",
									"SSH key fingerprint"
								)}
								value={sshKeyFingerprint}
								onChange={(e) => setSshKeyFingerprint(e.target.value)}
								fullWidth
							/>
						)}
					</Stack>
				}
			/>

			<Stack
				direction="row"
				justifyContent="flex-end"
				spacing={theme.spacing(LAYOUT.XS)}
			>
				<Button
					variant="outlined"
					onClick={() => navigate(`/settings/capture-agents/${agentId}/devices`)}
					type="button"
				>
					{t("common.actions.cancel", "Cancel")}
				</Button>
				<Button
					variant="contained"
					type="submit"
					loading={loading}
				>
					{t("pages.captureAgents.devices.add.submit", "Add device")}
				</Button>
			</Stack>
		</BasePage>
	);
};

export default AddCaptureAgentDevicePage;
