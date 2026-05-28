import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Stack, Typography, useTheme } from "@mui/material";
import { BasePage, ConfigBox } from "@/Components/design-elements";
import { Button, SwitchComponent as Switch, TextField } from "@/Components/inputs";
import { usePost } from "@/Hooks/UseApi";
import type { CaptureAgent } from "@/Types/CaptureAgent";
import { LAYOUT } from "@/Utils/Theme/constants";

// AddCaptureAgentPage hosts the registration form. The form keeps the
// plaintext secret in component state only until submit; on success the
// server hashes it for inbound auth and encrypts it for outbound dispatch
// so the plaintext is never stored client- or server-side beyond the
// request lifecycle.
const AddCaptureAgentPage = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { post, loading } = usePost<Record<string, unknown>, CaptureAgent>();

	const [name, setName] = useState("");
	const [url, setUrl] = useState("");
	const [secret, setSecret] = useState("");
	const [showSecret, setShowSecret] = useState(false);
	const [canCollectMetrics, setCanCollectMetrics] = useState(true);
	const [canExecuteScripts, setCanExecuteScripts] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validate = (): boolean => {
		const next: Record<string, string> = {};
		if (!name.trim())
			next.name = t("pages.captureAgents.add.errors.name", "Name is required");
		if (!url.trim()) {
			next.url = t("pages.captureAgents.add.errors.url", "URL is required");
		} else if (!/^https?:\/\//i.test(url.trim())) {
			next.url = t(
				"pages.captureAgents.add.errors.urlScheme",
				"URL must start with http:// or https://"
			);
		}
		if (secret.length < 8) {
			next.secret = t(
				"pages.captureAgents.add.errors.secret",
				"Secret must be at least 8 characters"
			);
		}
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!validate()) return;
		const res = await post("/capture-agents", {
			name: name.trim(),
			url: url.trim(),
			secret,
			canCollectMetrics,
			canExecuteScripts,
		});
		if (res?.success) {
			navigate("/settings/capture-agents");
		}
	};

	return (
		<BasePage
			component="form"
			onSubmit={handleSubmit}
		>
			<Stack>
				<Typography variant="h4">
					{t("pages.captureAgents.add.title", "Register capture agent")}
				</Typography>
				<Typography color={theme.palette.text.secondary}>
					{t(
						"pages.captureAgents.add.description",
						"Provide the agent's URL and shared secret. The secret is hashed on the server before storage."
					)}
				</Typography>
			</Stack>

			<ConfigBox
				title={t("pages.captureAgents.add.connection.title", "Connection")}
				subtitle={t(
					"pages.captureAgents.add.connection.description",
					"How Checkmate reaches the capture agent."
				)}
				rightContent={
					<Stack spacing={theme.spacing(LAYOUT.MD)}>
						<TextField
							fieldLabel={t("pages.captureAgents.add.fields.name.label", "Name")}
							placeholder={t(
								"pages.captureAgents.add.fields.name.placeholder",
								"prod-capture-eu"
							)}
							value={name}
							onChange={(e) => setName(e.target.value)}
							error={Boolean(errors.name)}
							helperText={errors.name ?? ""}
							fullWidth
						/>
						<TextField
							fieldLabel={t("pages.captureAgents.add.fields.url.label", "URL")}
							placeholder="https://capture.internal:59232"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							error={Boolean(errors.url)}
							helperText={errors.url ?? ""}
							fullWidth
						/>
						<Stack
							direction="row"
							alignItems="flex-end"
							spacing={theme.spacing(LAYOUT.XS)}
						>
							<TextField
								fieldLabel={t(
									"pages.captureAgents.add.fields.secret.label",
									"Shared secret"
								)}
								placeholder={
									t(
										"pages.captureAgents.add.fields.secret.placeholder",
										"32+ characters recommended"
									) as string
								}
								type={showSecret ? "text" : "password"}
								value={secret}
								onChange={(e) => setSecret(e.target.value)}
								error={Boolean(errors.secret)}
								helperText={errors.secret ?? ""}
								fullWidth
							/>
							<Button
								variant="outlined"
								onClick={() => setShowSecret((v) => !v)}
								type="button"
							>
								{showSecret
									? t("common.actions.hide", "Hide")
									: t("common.actions.show", "Show")}
							</Button>
						</Stack>
					</Stack>
				}
			/>

			<ConfigBox
				title={t("pages.captureAgents.add.capabilities.title", "Capabilities")}
				subtitle={t(
					"pages.captureAgents.add.capabilities.description",
					"Pick which workloads this agent should accept."
				)}
				rightContent={
					<Stack spacing={theme.spacing(LAYOUT.MD)}>
						<Stack
							direction="row"
							justifyContent="space-between"
							alignItems="center"
						>
							<Typography>
								{t("pages.captureAgents.add.capabilities.metrics", "Can collect metrics")}
							</Typography>
							<Switch
								checked={canCollectMetrics}
								onChange={(e) => setCanCollectMetrics(e.target.checked)}
							/>
						</Stack>
						<Stack
							direction="row"
							justifyContent="space-between"
							alignItems="center"
						>
							<Typography>
								{t("pages.captureAgents.add.capabilities.scripts", "Can execute scripts")}
							</Typography>
							<Switch
								checked={canExecuteScripts}
								onChange={(e) => setCanExecuteScripts(e.target.checked)}
							/>
						</Stack>
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
					onClick={() => navigate("/settings/capture-agents")}
					type="button"
				>
					{t("common.actions.cancel", "Cancel")}
				</Button>
				<Button
					variant="contained"
					type="submit"
					loading={loading}
				>
					{t("pages.captureAgents.add.submit", "Register agent")}
				</Button>
			</Stack>
		</BasePage>
	);
};

export default AddCaptureAgentPage;
