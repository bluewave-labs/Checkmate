import { BasePage, ConfigBox, TextLink } from "@/Components/design-elements";
import { Autocomplete, Select, Dialog, SwitchComponent } from "@/Components/inputs";
import { logger } from "@/Utils/logger";
import { LAYOUT } from "@/Utils/Theme/constants";
import {
	Stack,
	useTheme,
	MenuItem,
	Link,
	Alert,
	type SelectChangeEvent,
} from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import DummyChart from "@/Pages/Settings/DummyChart";
import { useGet, usePatch, usePost, useLazyGet } from "@/Hooks/UseApi";
import { useToast } from "@/Hooks/UseToast";
import { useSettingsForm } from "@/Hooks/useSettingsForm";
import { useIsAdmin } from "@/Hooks/useIsAdmin.js";
import type { SettingsFormData, SettingsFormInput } from "@/Validation/settings";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { TextField, Button, FieldLabel, SliderWithLabel } from "@/Components/inputs";
import { languageNames } from "@/Components/inputs/LanguageSelector";
import { Box, Typography } from "@mui/material";
import { useDelete } from "@/Hooks/UseApi";

import {
	setTimezone,
	setMode,
	setLanguage,
	setChartType,
	type ThemeMode,
	type ChartType,
} from "@/Features/UI/uiSlice.js";
import timezones from "@/Utils/timezones.json";
import type { RootState } from "@/Types/state";
import { CHECK_TTL_SENTINEL } from "@/Types/Check";

interface Timezone {
	id: string;
	name: string;
}

interface SettingsResponse {
	settings: any;
	pagespeedKeySet: boolean;
	emailPasswordSet: boolean;
	globalpingTokenSet: boolean;
}

export const SettingsPage = () => {
	const theme = useTheme();
	const { t, i18n } = useTranslation();
	const dispatch = useDispatch();
	const isAdmin = useIsAdmin();
	const { toastError } = useToast();
	// Local state for demo monitors dialog
	const [isDemoMonitorsDialogOpen, setIsDemoMonitorsDialogOpen] = useState(false);
	const { post: postDemoMonitors, loading: isPostingDemoMonitors } = usePost();
	const { deleteFn: deleteAllMonitors, loading: isDeletingAllMonitors } = useDelete();
	// Import monitors functionality
	const { post: importMonitors, loading: isImportingMonitors } = usePost();

	// Fetch settings data from API
	const { data: fetchedSettings } = useGet<SettingsResponse>("/settings");
	// Form submission
	const { patch, loading: isSaving } = usePatch<SettingsFormData, SettingsResponse>();

	// Local state for API key reset
	const [isApiKeySet, setIsApiKeySet] = useState(
		fetchedSettings?.pagespeedKeySet ?? false
	);
	const [apiKeyHasBeenReset, setApiKeyHasBeenReset] = useState(false);
	// Local state for email password reset
	const [isEmailPasswordSet, setIsEmailPasswordSet] = useState(
		fetchedSettings?.emailPasswordSet ?? false
	);
	const [emailPasswordHasBeenReset, setEmailPasswordHasBeenReset] = useState(false);
	// Local state for GlobalPing token reset
	const [isGlobalpingTokenSet, setIsGlobalpingTokenSet] = useState(
		fetchedSettings?.globalpingTokenSet ?? false
	);
	const [globalpingTokenHasBeenReset, setGlobalpingTokenHasBeenReset] = useState(false);
	const [globalpingQuota, setGlobalpingQuota] = useState<{
		authenticated: boolean;
		remaining: number;
		limit: number;
	} | null>(null);
	const [globalpingTestStatus, setGlobalpingTestStatus] = useState<
		"idle" | "loading" | "ok" | "invalid" | "saved"
	>("idle");
	const [isSavingGlobalpingToken, setIsSavingGlobalpingToken] = useState(false);
	const { post: testGlobalpingToken } = usePost<
		{ token?: string },
		{ authenticated: boolean; remaining: number; limit: number } | null
	>();
	// Test email functionality
	const { post: sendTestEmail, loading: isSendingTestEmail } = usePost();
	// Local state for clear stats dialog
	const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
	const { deleteFn: deleteStats, loading: isDeletingStats } = useDelete();
	// Export monitors functionality
	const { get: fetchMonitorsJson } = useLazyGet();

	// Initialize form with schema and defaults
	const { schema, defaults } = useSettingsForm({ data: fetchedSettings?.settings });

	const form = useForm<SettingsFormInput, unknown, SettingsFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
		mode: "onChange",
	});

	// Reset form when defaults change
	useEffect(() => {
		form.reset(defaults);
	}, [defaults, form]);

	// Update isApiKeySet when fetchedSettings changes
	useEffect(() => {
		if (fetchedSettings) {
			setIsApiKeySet(fetchedSettings.pagespeedKeySet);
			setIsEmailPasswordSet(fetchedSettings.emailPasswordSet);
			setIsGlobalpingTokenSet(fetchedSettings.globalpingTokenSet);
		}
	}, [fetchedSettings]);

	const {
		timezone: selectedTimezoneId,
		mode,
		language = "en",
		chartType = "histogram",
	} = useSelector((state: RootState) => state.ui);

	const user = useSelector((state: RootState) => state.auth.user);

	// Convert timezones to match AutoComplete format (id instead of _id)
	const timezoneOptions: Timezone[] = timezones.map((tz) => ({
		id: tz._id,
		name: tz.name,
	}));

	const selectedTimezone =
		timezoneOptions.find((tz) => tz.id === selectedTimezoneId) ?? null;

	const handleTimezoneChange = (newValue: Timezone | null) => {
		if (!newValue?.id) return;
		dispatch(setTimezone({ timezone: newValue.id }));
	};

	const handleModeChange = (e: SelectChangeEvent<ThemeMode>) => {
		dispatch(setMode(e.target.value));
	};

	const handleLanguageChange = (e: SelectChangeEvent<string>) => {
		dispatch(setLanguage(e.target.value));
	};

	const handleChartTypeChange = (e: SelectChangeEvent<ChartType>) => {
		dispatch(setChartType(e.target.value));
	};

	const handleResetApiKey = () => {
		form.setValue("pagespeedApiKey", "");
		setApiKeyHasBeenReset(true);
	};

	const handleResetEmailPassword = () => {
		form.setValue("systemEmailPassword", "");
		setEmailPasswordHasBeenReset(true);
	};

	const handleResetGlobalpingToken = () => {
		form.setValue("globalpingApiToken", "");
		setGlobalpingTokenHasBeenReset(true);
		setIsGlobalpingTokenSet(false);
		setGlobalpingQuota(null);
		setGlobalpingTestStatus("idle");
	};

	const handleTestGlobalpingToken = async () => {
		setGlobalpingTestStatus("loading");
		const tokenValue = form.getValues("globalpingApiToken");
		const result = await testGlobalpingToken("/settings/globalping/test", {
			token: tokenValue || undefined,
		});
		if (result?.success && result.data) {
			setGlobalpingQuota(result.data);
			setGlobalpingTestStatus("ok");
		} else {
			setGlobalpingQuota(null);
			setGlobalpingTestStatus("invalid");
		}
	};

	const handleSaveGlobalpingToken = async () => {
		const tokenValue = form.getValues("globalpingApiToken");
		if (!tokenValue) return;
		setIsSavingGlobalpingToken(true);
		const result = await patch("/settings", {
			globalpingApiToken: tokenValue,
		} as unknown as SettingsFormData);
		setIsSavingGlobalpingToken(false);
		if (result?.success && result.data) {
			setIsGlobalpingTokenSet(result.data.globalpingTokenSet);
			setGlobalpingTokenHasBeenReset(false);
			setGlobalpingTestStatus("saved");
		}
	};

	const handleSendTestEmail = async () => {
		const formValues = form.getValues();
		if (!user) {
			alert("User not authenticated");
			return;
		}
		if (
			!formValues.systemEmailHost ||
			!formValues.systemEmailPort ||
			!formValues.systemEmailAddress ||
			!formValues.systemEmailPassword
		) {
			alert("Please fill in all required email fields before testing.");
			return;
		}

		await sendTestEmail("/settings/test-email", {
			to: user.email,
			systemEmailHost: formValues.systemEmailHost,
			systemEmailPort: formValues.systemEmailPort,
			systemEmailAddress: formValues.systemEmailAddress,
			systemEmailPassword: formValues.systemEmailPassword,
			systemEmailSecure: formValues.systemEmailSecure,
			systemEmailPool: formValues.systemEmailPool,
			systemEmailIgnoreTLS: formValues.systemEmailIgnoreTLS,
			systemEmailRequireTLS: formValues.systemEmailRequireTLS,
			systemEmailRejectUnauthorized: formValues.systemEmailRejectUnauthorized,
			...(formValues.systemEmailUser && { systemEmailUser: formValues.systemEmailUser }),
			...(formValues.systemEmailDisplayName && {
				systemEmailDisplayName: formValues.systemEmailDisplayName,
			}),
			...(formValues.systemEmailTLSServername && {
				systemEmailTLSServername: formValues.systemEmailTLSServername,
			}),
			...(formValues.systemEmailConnectionHost && {
				systemEmailConnectionHost: formValues.systemEmailConnectionHost,
			}),
		});
	};

	const handleClearStats = async () => {
		await deleteStats("/checks/team");
		setIsStatsDialogOpen(false);
	};

	const handleExportMonitors = async () => {
		const res = await fetchMonitorsJson("/monitors/export/json");
		const json = res?.data ?? [];
		if (!json || json.length === 0) {
			return;
		}

		const blob = new Blob([JSON.stringify(json, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);

		const link = document.createElement("a");
		link.href = url;
		link.download = "monitors.json";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		if (file.type !== "application/json") {
			toastError("Please select a valid JSON file");
			event.target.value = "";
		}

		try {
			const text = await file.text();
			const monitors = JSON.parse(text);

			if (!Array.isArray(monitors)) {
				toastError("Invalid file format: expected an array of monitors");
				event.target.value = "";
				return;
			}

			await importMonitors("/monitors/import/json", { monitors });

			event.target.value = "";
		} catch (error) {
			toastError("Error parsing JSON file. Please check the file format.");
			event.target.value = "";
		}
	};

	const onSubmit = async (data: SettingsFormData) => {
		// Don't send pagespeedApiKey if it's already set and user hasn't clicked reset
		const dataToSend = { ...data };
		if (isApiKeySet && !apiKeyHasBeenReset) {
			delete (dataToSend as any).pagespeedApiKey;
		}
		if (isEmailPasswordSet && !emailPasswordHasBeenReset) {
			delete (dataToSend as any).systemEmailPassword;
		}
		if (isGlobalpingTokenSet && !globalpingTokenHasBeenReset) {
			delete (dataToSend as any).globalpingApiToken;
		}

		const result = await patch("/settings", dataToSend as SettingsFormData);

		if (result?.success) {
			// Update API key state from response
			if (result.data) {
				setIsApiKeySet(result.data.pagespeedKeySet);
				setApiKeyHasBeenReset(false);
				setIsEmailPasswordSet(result.data.emailPasswordSet);
				setEmailPasswordHasBeenReset(false);
				setIsGlobalpingTokenSet(result.data.globalpingTokenSet);
				setGlobalpingTokenHasBeenReset(false);
			}
		}
	};

	const onError = (errors: unknown) => {
		logger.debug("Form validation errors", errors);
	};

	const languages = Object.keys(i18n.options.resources || {});

	return (
		<BasePage
			headerKey="settings"
			component="form"
			onSubmit={form.handleSubmit(onSubmit, onError)}
		>
			<Stack gap={theme.spacing(LAYOUT.MD)}>
				<ConfigBox
					title={t("pages.settings.form.timezone.title")}
					subtitle={t("pages.settings.form.timezone.description")}
					rightContent={
						<Autocomplete
							value={selectedTimezone}
							options={timezoneOptions}
							getOptionLabel={(option: Timezone) => option.name}
							isOptionEqualToValue={(option: Timezone, value: Timezone) =>
								option.id === value.id
							}
							onChange={(_, newValue) => {
								handleTimezoneChange(newValue as Timezone | null);
							}}
							fieldLabel={t("pages.settings.form.timezone.option.timezone.label")}
						/>
					}
				/>
				<ConfigBox
					title={t("pages.settings.form.ui.title")}
					subtitle={t("pages.settings.form.ui.description")}
					rightContent={
						<Stack gap={theme.spacing(LAYOUT.MD)}>
							<Select
								value={mode}
								onChange={handleModeChange}
								fieldLabel={t("pages.settings.form.ui.option.theme.label")}
							>
								<MenuItem value="light">
									{t("pages.settings.form.ui.option.theme.light")}
								</MenuItem>
								<MenuItem value="dark">
									{t("pages.settings.form.ui.option.theme.dark")}
								</MenuItem>
							</Select>
							<Select
								value={language}
								onChange={handleLanguageChange}
								fieldLabel={t("pages.settings.form.ui.option.language.label")}
							>
								{languages.map((lang) => (
									<MenuItem
										key={lang}
										value={lang}
									>
										{languageNames[lang] ?? lang}
									</MenuItem>
								))}
							</Select>
							<Select
								value={chartType}
								onChange={handleChartTypeChange}
								fieldLabel={t("pages.settings.form.ui.option.chartType.label")}
							>
								<MenuItem value="histogram">
									{t("pages.settings.form.ui.option.chartType.histogram")}
								</MenuItem>
								<MenuItem value="heatmap">
									{t("pages.settings.form.ui.option.chartType.heatmap")}
								</MenuItem>
							</Select>
							<DummyChart chartType={chartType} />
						</Stack>
					}
				/>
				{isAdmin && (
					<ConfigBox
						title={t("pages.settings.form.pagespeed.title")}
						subtitle={t("pages.settings.form.pagespeed.description")}
						rightContent={
							<>
								{(isApiKeySet === false || apiKeyHasBeenReset === true) && (
									<Controller
										name="pagespeedApiKey"
										control={form.control}
										defaultValue={defaults.pagespeedApiKey}
										render={({ field, fieldState }) => (
											<TextField
												{...field}
												fieldLabel={t(
													"pages.settings.form.pagespeed.option.apiKey.label"
												)}
												type="password"
												placeholder={t(
													"pages.settings.form.pagespeed.option.apiKey.placeholder"
												)}
												error={!!fieldState.error}
												helperText={fieldState.error?.message}
											/>
										)}
									/>
								)}

								{isApiKeySet === true && apiKeyHasBeenReset === false && (
									<Box>
										<FieldLabel>
											{t("pages.settings.form.pagespeed.option.apiKey.labelSet")}
										</FieldLabel>
										<Button
											onClick={handleResetApiKey}
											variant="contained"
											color="error"
										>
											{t("common.buttons.reset")}
										</Button>
									</Box>
								)}
							</>
						}
					/>
				)}

				{isAdmin && (
					<ConfigBox
						title={t("pages.settings.form.distributedMonitoring.title")}
						subtitle={t("pages.settings.form.distributedMonitoring.description")}
						rightContent={
							<Stack gap={theme.spacing(LAYOUT.MD)}>
								<Stack
									direction="row"
									gap={theme.spacing(LAYOUT.MD)}
								>
									<Link
										href="https://dash.globalping.io/"
										target="_blank"
										rel="noopener noreferrer"
									>
										{t("pages.settings.form.distributedMonitoring.getTokenLink")}
									</Link>
									<Link
										href="https://globalping.io/docs/api.globalping.io#overview"
										target="_blank"
										rel="noopener noreferrer"
									>
										{t("pages.settings.form.distributedMonitoring.docsLink")}
									</Link>
								</Stack>
								{(isGlobalpingTokenSet === false ||
									globalpingTokenHasBeenReset === true) && (
									<Controller
										name="globalpingApiToken"
										control={form.control}
										defaultValue={defaults.globalpingApiToken}
										render={({ field, fieldState }) => (
											<TextField
												{...field}
												fieldLabel={t(
													"pages.settings.form.distributedMonitoring.option.apiToken.label"
												)}
												type="password"
												placeholder={t(
													"pages.settings.form.distributedMonitoring.option.apiToken.placeholder"
												)}
												error={!!fieldState.error}
												helperText={fieldState.error?.message}
											/>
										)}
									/>
								)}
								{isGlobalpingTokenSet === true &&
									globalpingTokenHasBeenReset === false && (
										<Box>
											<FieldLabel>
												{t(
													"pages.settings.form.distributedMonitoring.option.apiToken.labelSet"
												)}
											</FieldLabel>
											<Button
												onClick={handleResetGlobalpingToken}
												variant="contained"
												color="error"
											>
												{t("pages.settings.form.distributedMonitoring.actions.reset")}
											</Button>
										</Box>
									)}
								{(isGlobalpingTokenSet === false ||
									globalpingTokenHasBeenReset === true) && (
									<Stack
										direction="row"
										gap={theme.spacing(LAYOUT.SM)}
									>
										<Button
											onClick={handleTestGlobalpingToken}
											variant="outlined"
											disabled={globalpingTestStatus === "loading"}
										>
											{globalpingTestStatus === "loading"
												? t("pages.settings.form.distributedMonitoring.actions.testing")
												: t("pages.settings.form.distributedMonitoring.actions.test")}
										</Button>
										<Button
											onClick={handleSaveGlobalpingToken}
											variant="contained"
											disabled={isSavingGlobalpingToken}
										>
											{isSavingGlobalpingToken
												? t("pages.settings.form.distributedMonitoring.actions.saving")
												: t("pages.settings.form.distributedMonitoring.actions.save")}
										</Button>
									</Stack>
								)}
								{globalpingTestStatus === "ok" && globalpingQuota && (
									<Typography
										variant="body1"
										color={theme.palette.success.main}
									>
										{globalpingQuota.authenticated
											? t(
													"pages.settings.form.distributedMonitoring.status.authenticated",
													{
														remaining: globalpingQuota.remaining,
														limit: globalpingQuota.limit,
													}
												)
											: t("pages.settings.form.distributedMonitoring.status.anonymous", {
													remaining: globalpingQuota.remaining,
													limit: globalpingQuota.limit,
												})}
									</Typography>
								)}
								{globalpingTestStatus === "invalid" && (
									<Typography
										variant="body1"
										color={theme.palette.error.main}
									>
										{t("pages.settings.form.distributedMonitoring.status.invalid")}
									</Typography>
								)}
								{globalpingTestStatus === "saved" && (
									<Typography
										variant="body1"
										color={theme.palette.success.main}
									>
										{t("pages.settings.form.distributedMonitoring.status.saved")}
									</Typography>
								)}
							</Stack>
						}
					/>
				)}

				{/* URL Settings */}
				<ConfigBox
					title={t("pages.settings.form.url.title")}
					subtitle={t("pages.settings.form.url.description")}
					rightContent={
						<Controller
							name="showURL"
							control={form.control}
							defaultValue={defaults.showURL}
							render={({ field, fieldState }) => (
								<Select
									{...field}
									value={field.value === undefined ? "false" : field.value.toString()}
									onChange={(e) => {
										const value = e.target.value === "true";
										field.onChange(value);
									}}
									fieldLabel={t("pages.settings.form.url.option.showURL.label")}
									error={!!fieldState.error}
								>
									<MenuItem value="true">
										{t("pages.settings.form.url.option.showURL.enabled")}
									</MenuItem>
									<MenuItem value="false">
										{t("pages.settings.form.url.option.showURL.disabled")}
									</MenuItem>
								</Select>
							)}
						/>
					}
				/>

				{/* Clear All Stats */}
				{isAdmin && (
					<ConfigBox
						title={t("pages.settings.form.stats.title")}
						subtitle={t("pages.settings.form.stats.description")}
						rightContent={
							<Button
								variant="contained"
								color="error"
								onClick={() => setIsStatsDialogOpen(true)}
							>
								{t("common.buttons.clear")}
							</Button>
						}
					/>
				)}

				{/* Check Retention */}
				{isAdmin && (
					<ConfigBox
						title={t("pages.settings.form.retention.title")}
						subtitle={t("pages.settings.form.retention.description")}
						rightContent={
							<Controller
								name="checkTTL"
								control={form.control}
								defaultValue={defaults.checkTTL}
								render={({ field }) => (
									<SliderWithLabel
										{...field}
										fieldLabel={t("pages.settings.form.retention.option.days.label")}
										min={1}
										max={CHECK_TTL_SENTINEL}
										sliderMaxWidth={{ xs: "100%", md: "50%" }}
										value={field.value || 30}
										onChange={(_, value) => field.onChange(value)}
										valueLabelDisplay="auto"
										valueLabelFormat={(value: number) =>
											value >= CHECK_TTL_SENTINEL
												? t("pages.settings.form.retention.option.days.unlimited")
												: `${value}`
										}
										formatDisplayValue={(value: number) =>
											value >= CHECK_TTL_SENTINEL
												? t("pages.settings.form.retention.option.days.unlimited")
												: `${value}`
										}
									/>
								)}
							/>
						}
					/>
				)}

				{/* Global Thresholds */}
				{isAdmin && (
					<ConfigBox
						title={t("pages.settings.form.thresholds.title")}
						subtitle={t("pages.settings.form.thresholds.description")}
						rightContent={
							<Stack spacing={2}>
								<Controller
									name="globalThresholds.cpu"
									control={form.control}
									defaultValue={defaults.globalThresholds?.cpu}
									render={({ field }) => (
										<SliderWithLabel
											{...field}
											fieldLabel={t("pages.settings.form.thresholds.option.cpu.label")}
											min={1}
											max={100}
											sliderMaxWidth={{ xs: "100%", md: "50%" }}
											value={field.value || 1}
											onChange={(_, value) => field.onChange(value)}
											valueLabelDisplay="auto"
										/>
									)}
								/>
								<Controller
									name="globalThresholds.memory"
									control={form.control}
									defaultValue={defaults.globalThresholds?.memory}
									render={({ field }) => (
										<SliderWithLabel
											{...field}
											fieldLabel={t("pages.settings.form.thresholds.option.memory.label")}
											min={1}
											max={100}
											sliderMaxWidth={{ xs: "100%", md: "50%" }}
											value={field.value || 1}
											onChange={(_, value) => field.onChange(value)}
											valueLabelDisplay="auto"
										/>
									)}
								/>
								<Controller
									name="globalThresholds.disk"
									control={form.control}
									defaultValue={defaults.globalThresholds?.disk}
									render={({ field }) => (
										<SliderWithLabel
											{...field}
											fieldLabel={t("pages.settings.form.thresholds.option.disk.label")}
											min={1}
											max={100}
											sliderMaxWidth={{ xs: "100%", md: "50%" }}
											value={field.value || 1}
											onChange={(_, value) => field.onChange(value)}
											valueLabelDisplay="auto"
										/>
									)}
								/>
								<Controller
									name="globalThresholds.temperature"
									control={form.control}
									defaultValue={defaults.globalThresholds?.temperature}
									render={({ field }) => (
										<SliderWithLabel
											{...field}
											fieldLabel={t(
												"pages.settings.form.thresholds.option.temperature.label"
											)}
											min={1}
											max={150}
											sliderMaxWidth={{ xs: "100%", md: "50%" }}
											value={field.value || 1}
											onChange={(_, value) => field.onChange(value)}
											valueLabelDisplay="auto"
										/>
									)}
								/>
							</Stack>
						}
					/>
				)}
			</Stack>

			{/* Email Settings - Admin Only */}
			{isAdmin && (
				<ConfigBox
					title={t("pages.settings.form.email.title")}
					subtitle={t("pages.settings.form.email.description")}
					leftContent={
						<Stack gap={theme.spacing(LAYOUT.MD)}>
							<TextLink
								text={t("pages.settings.form.email.descriptionTransport")}
								linkText={t("pages.settings.form.email.descriptionTransportLink")}
								href="https://nodemailer.com/smtp/"
								target="_blank"
							/>
							{(() => {
								const address = form.watch("systemEmailAddress") || "";
								const displayName = form.watch("systemEmailDisplayName")?.trim();
								return (
									<>
										<Box
											component="pre"
											p={2}
											borderRadius={theme.shape.borderRadius}
											bgcolor={theme.palette.action.hover}
											sx={{
												fontFamily: theme.typography.fontFamilyMonospace,
												overflow: "auto",
											}}
										>
											<code>
												{JSON.stringify(
													{
														host: form.watch("systemEmailHost") || "",
														port: form.watch("systemEmailPort") || "",
														secure: form.watch("systemEmailSecure") ?? false,
														auth: {
															user: form.watch("systemEmailUser") || address,
															pass: "<your_password>",
														},
														name: form.watch("systemEmailConnectionHost") || "localhost",
														pool: form.watch("systemEmailPool") ?? false,
														tls: {
															rejectUnauthorized:
																form.watch("systemEmailRejectUnauthorized") ?? true,
															ignoreTLS: form.watch("systemEmailIgnoreTLS") ?? false,
															requireTLS: form.watch("systemEmailRequireTLS") ?? false,
															servername: form.watch("systemEmailTLSServername") || "",
														},
													},
													null,
													2
												)}
											</code>
										</Box>
										{address && (
											<Box
												component="pre"
												p={2}
												borderRadius={theme.shape.borderRadius}
												bgcolor={theme.palette.action.hover}
												sx={{
													fontFamily: theme.typography.fontFamilyMonospace,
													overflow: "auto",
												}}
											>
												<code>
													{`From: ${displayName ? `"${displayName}" <${address}>` : address}`}
												</code>
											</Box>
										)}
									</>
								);
							})()}
						</Stack>
					}
					rightContent={
						<Stack gap={theme.spacing(LAYOUT.MD)}>
							{/* Email Host */}
							<Controller
								name="systemEmailHost"
								control={form.control}
								render={({ field, fieldState }) => (
									<TextField
										{...field}
										value={field.value ?? ""}
										fieldLabel={t("pages.settings.form.email.option.host.label")}
										placeholder={t("pages.settings.form.email.option.host.placeholder")}
										error={!!fieldState.error}
										helperText={fieldState.error?.message}
									/>
								)}
							/>

							{/* Email Port */}
							<Controller
								name="systemEmailPort"
								control={form.control}
								render={({ field, fieldState }) => (
									<TextField
										name={field.name}
										ref={field.ref}
										onBlur={field.onBlur}
										value={
											field.value === undefined || field.value === 0 ? "" : field.value
										}
										onChange={(e) => {
											const val = e.target.value;
											field.onChange(val === "" ? 0 : Number(val));
										}}
										fieldLabel={t("pages.settings.form.email.option.port.label")}
										type="number"
										inputProps={{ min: 0 }}
										placeholder={t("pages.settings.form.email.option.port.placeholder")}
										error={!!fieldState.error}
										helperText={fieldState.error?.message}
									/>
								)}
							/>

							{/* Email Address */}
							<Controller
								name="systemEmailAddress"
								control={form.control}
								render={({ field, fieldState }) => (
									<TextField
										{...field}
										value={field.value ?? ""}
										fieldLabel={t("pages.settings.form.email.option.address.label")}
										placeholder={t(
											"pages.settings.form.email.option.address.placeholder"
										)}
										type="email"
										error={!!fieldState.error}
										helperText={fieldState.error?.message}
									/>
								)}
							/>

							{/* Email Display Name (Optional) */}
							<Controller
								name="systemEmailDisplayName"
								control={form.control}
								render={({ field, fieldState }) => (
									<TextField
										{...field}
										value={field.value ?? ""}
										fieldLabel={t("pages.settings.form.email.option.displayName.label")}
										placeholder={t(
											"pages.settings.form.email.option.displayName.placeholder"
										)}
										error={!!fieldState.error}
										helperText={fieldState.error?.message}
									/>
								)}
							/>

							{/* Email User (Optional) */}
							<Controller
								name="systemEmailUser"
								control={form.control}
								render={({ field, fieldState }) => (
									<TextField
										{...field}
										value={field.value ?? ""}
										fieldLabel={t("pages.settings.form.email.option.user.label")}
										placeholder={t("pages.settings.form.email.option.user.placeholder")}
										error={!!fieldState.error}
										helperText={fieldState.error?.message}
									/>
								)}
							/>

							{/* Email Password with Reset Pattern */}
							{isEmailPasswordSet && !emailPasswordHasBeenReset ? (
								<Box>
									<FieldLabel>
										{t("pages.settings.form.email.option.password.labelSet")}
									</FieldLabel>
									<Stack
										direction="row"
										alignItems="center"
										gap={theme.spacing(LAYOUT.XS)}
									>
										<Button
											variant="contained"
											color="error"
											size="small"
											onClick={handleResetEmailPassword}
										>
											{t("common.buttons.reset")}
										</Button>
									</Stack>
								</Box>
							) : (
								<Controller
									name="systemEmailPassword"
									control={form.control}
									render={({ field, fieldState }) => (
										<TextField
											{...field}
											value={field.value ?? ""}
											fieldLabel={t("pages.settings.form.email.option.password.label")}
											type="password"
											placeholder={t(
												"pages.settings.form.email.option.password.placeholder"
											)}
											error={!!fieldState.error}
											helperText={fieldState.error?.message}
										/>
									)}
								/>
							)}

							{/* TLS Servername (Optional) */}
							<Controller
								name="systemEmailTLSServername"
								control={form.control}
								render={({ field, fieldState }) => (
									<TextField
										{...field}
										value={field.value ?? ""}
										fieldLabel={t("pages.settings.form.email.option.tlsServername.label")}
										placeholder={t(
											"pages.settings.form.email.option.tlsServername.placeholder"
										)}
										error={!!fieldState.error}
										helperText={fieldState.error?.message}
									/>
								)}
							/>

							{/* Connection Host (Optional) */}
							<Controller
								name="systemEmailConnectionHost"
								control={form.control}
								render={({ field, fieldState }) => (
									<TextField
										{...field}
										value={field.value ?? ""}
										fieldLabel={t(
											"pages.settings.form.email.option.connectionHost.label"
										)}
										placeholder={t(
											"pages.settings.form.email.option.connectionHost.placeholder"
										)}
										error={!!fieldState.error}
										helperText={fieldState.error?.message}
									/>
								)}
							/>

							{/* Boolean Switches */}
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									gap: theme.spacing(LAYOUT.XS),
								}}
							>
								{[
									{
										name: "systemEmailSecure",
										label: t("pages.settings.form.email.option.secure.label"),
									},
									{
										name: "systemEmailPool",
										label: t("pages.settings.form.email.option.pool.label"),
									},
									{
										name: "systemEmailIgnoreTLS",
										label: t("pages.settings.form.email.option.ignoreTLS.label"),
									},
									{
										name: "systemEmailRequireTLS",
										label: t("pages.settings.form.email.option.requireTLS.label"),
									},
									{
										name: "systemEmailRejectUnauthorized",
										label: t("pages.settings.form.email.option.rejectUnauthorized.label"),
									},
								].map(({ name, label }) => (
									<Controller
										key={name}
										name={name as any}
										control={form.control}
										render={({ field }) => (
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													justifyContent: "space-between",
												}}
											>
												<Typography>{label}</Typography>
												<SwitchComponent
													checked={field.value ?? false}
													onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
														field.onChange(e.target.checked)
													}
												/>
											</Box>
										)}
									/>
								))}
							</Box>

							{/* Test Email Button */}
							<Box>
								<Button
									variant="contained"
									loading={isSendingTestEmail}
									onClick={handleSendTestEmail}
									disabled={
										!form.watch("systemEmailHost") ||
										!form.watch("systemEmailPort") ||
										!form.watch("systemEmailAddress") ||
										!form.watch("systemEmailPassword")
									}
								>
									{t("common.buttons.sendTestEmail")}
								</Button>
							</Box>
						</Stack>
					}
				/>
			)}

			{/* Demo Monitors - Admin Only */}
			{isAdmin && (
				<ConfigBox
					title={t("pages.settings.form.demoMonitors.title")}
					subtitle={t("pages.settings.form.demoMonitors.description")}
					rightContent={
						<Box>
							<Button
								variant="contained"
								loading={isPostingDemoMonitors}
								onClick={async () => {
									await postDemoMonitors("/monitors/demo", {});
								}}
							>
								{t("common.buttons.addDemo")}
							</Button>
						</Box>
					}
				/>
			)}

			{/* Remove All Monitors - Admin Only */}
			{isAdmin && (
				<ConfigBox
					title={t("pages.settings.form.removeMonitors.title")}
					subtitle={t("pages.settings.form.removeMonitors.description")}
					rightContent={
						<Box>
							<Button
								variant="contained"
								color="error"
								loading={isDeletingAllMonitors}
								onClick={() => setIsDemoMonitorsDialogOpen(true)}
							>
								{t("common.buttons.removeMonitors")}
							</Button>
						</Box>
					}
				/>
			)}

			{/* Export Monitors - Admin Only */}
			{isAdmin && (
				<ConfigBox
					title={t("pages.settings.form.importExportMonitors.title")}
					subtitle={t("pages.settings.form.importExportMonitors.description")}
					rightContent={
						<Stack
							gap={theme.spacing(LAYOUT.MD)}
							direction={"row"}
						>
							<input
								id="monitor-import-input"
								type="file"
								accept=".json"
								style={{ display: "none" }}
								onChange={handleFileSelect}
							/>
							<Button
								variant="contained"
								onClick={() => document.getElementById("monitor-import-input")?.click()}
								disabled={isImportingMonitors}
							>
								{t("common.buttons.importFromJSON")}
							</Button>
							<Button
								variant="contained"
								onClick={handleExportMonitors}
							>
								{t("common.buttons.exportToJSON")}
							</Button>
						</Stack>
					}
				/>
			)}

			{/* About */}
			<ConfigBox
				title={t("pages.settings.form.about.title")}
				subtitle=""
				rightContent={
					<Stack spacing={2}>
						<Typography variant="body1">
							{t("common.appName")} {__APP_VERSION__}
						</Typography>
						<Typography
							variant="body2"
							sx={{ opacity: 0.6 }}
						>
							{t("pages.settings.form.about.developedBy")}
						</Typography>
						<Link
							href="https://github.com/bluewave-labs/checkmate"
							target="_blank"
							rel="noopener noreferrer"
						>
							https://github.com/bluewave-labs/checkmate
						</Link>
					</Stack>
				}
			/>

			{/* Clear Stats Confirmation Dialog */}
			<Dialog
				open={isStatsDialogOpen}
				title={t("pages.settings.form.stats.dialog.title")}
				content={t("pages.settings.form.stats.dialog.description")}
				onCancel={() => setIsStatsDialogOpen(false)}
				onConfirm={handleClearStats}
				loading={isDeletingStats}
			/>

			{/* Delete All Monitors Confirmation Dialog */}
			<Dialog
				open={isDemoMonitorsDialogOpen}
				title={t("pages.settings.form.removeMonitors.dialog.title")}
				content={t("pages.settings.form.removeMonitors.dialog.description")}
				onCancel={() => setIsDemoMonitorsDialogOpen(false)}
				onConfirm={async () => {
					await deleteAllMonitors("/monitors/");
					setIsDemoMonitorsDialogOpen(false);
				}}
				loading={isDeletingAllMonitors}
				confirmColor="error"
				confirmText={t("common.buttons.removeMonitors")}
			>
				<Typography variant="body1">
					{t("pages.settings.form.removeMonitors.dialog.paragraph")}
				</Typography>
			</Dialog>

			<Stack
				direction="row"
				justifyContent="flex-end"
				sx={{
					position: "sticky",
					bottom: 0,
					padding: theme.spacing(LAYOUT.MD),
					zIndex: 1000,
				}}
			>
				{/* Validation Error Display */}
				{Object.keys(form.formState.errors).length > 0 && (
					<Alert
						severity="error"
						sx={{ mb: 2, flexGrow: 1, mr: 2 }}
					>
						<Typography
							variant="body2"
							sx={{ fontWeight: 600, mb: 1 }}
						>
							{t("pages.settings.form.validation.errorMessage")}
						</Typography>
						<Box
							component="ul"
							sx={{ m: 0, pl: 2 }}
						>
							{Object.entries(form.formState.errors).map(([field, error]) => {
								const message =
									typeof error === "object" && error?.message
										? error.message
										: "Invalid value";
								return (
									<li key={field}>
										<Typography variant="body2">
											<strong>{field}:</strong> {message}
										</Typography>
									</li>
								);
							})}
						</Box>
					</Alert>
				)}

				<Button
					loading={isSaving}
					type="submit"
					variant="contained"
					color="primary"
					disabled={!form.formState.isValid}
				>
					{t("common.buttons.save")}
				</Button>
			</Stack>
		</BasePage>
	);
};

export default SettingsPage;
