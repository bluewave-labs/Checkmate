import { BasePage, ConfigBox, TextLink, Tabs, Tab } from "@/Components/design-elements";
import { Autocomplete, Select, Dialog } from "@/Components/inputs";
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
import { useEffect, useMemo } from "react";
import { FormProvider, useForm, type FieldPath } from "react-hook-form";
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
import { Button, FieldLabel } from "@/Components/inputs";
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
import { timezoneOptions } from "@/Utils/timezoneOptions";
import type { TimezoneOption } from "@/Utils/timezoneOptions";
import type { RootState } from "@/Types/state";
import { CHECK_TTL_SENTINEL } from "@/Types/Check";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";
import { FormSliderField } from "@/Components/inputs/forms/FormSliderField";
import { FormSwitchField } from "@/Components/inputs/forms/FormSwitchField";
import { FormNumberField } from "@/Components/inputs/forms/FormNumberField";
import { FormSelectField } from "@/Components/inputs/forms/FormSelectField";
import type { ProxyResponse } from "@/Types/Proxy";
import type { AppSettingsResponse } from "@/Types/Settings";
import { useSearchParams } from "react-router-dom";

const SETTINGS_TABS = [
	{ key: "general", labelKey: "pages.settings.tabs.general" },
	{ key: "monitoring", labelKey: "pages.settings.tabs.monitoring", adminOnly: true },
	{ key: "email", labelKey: "pages.settings.tabs.email", adminOnly: true },
	{ key: "integrations", labelKey: "pages.settings.tabs.integrations", adminOnly: true },
	{ key: "data", labelKey: "pages.settings.tabs.data", adminOnly: true },
] as const;

type SettingsTabKey = (typeof SETTINGS_TABS)[number]["key"];

// Maps a validation error back to the tab holding it, so a failed save can
// reveal the offending field instead of naming one on a hidden tab.
const FIELD_TAB: Record<string, SettingsTabKey> = {
	checkTTL: "monitoring",
	globalThresholds: "monitoring",
	pagespeedApiKey: "integrations",
	globalProxyEnabled: "integrations",
	globalProxyId: "integrations",
	showURL: "general",
};

const tabForField = (field: string): SettingsTabKey =>
	field.startsWith("systemEmail")
		? "email"
		: (FIELD_TAB[field.split(".")[0]] ?? "general");

// Error rows named the raw schema key ("systemEmailRejectUnauthorized"). Each
// field already owns a translated label, so reuse those rather than adding
// strings. Labels that append an explanation after a dash are trimmed to the
// name itself.
const FIELD_LABEL_KEY: Record<string, string> = {
	checkTTL: "pages.settings.form.retention.option.days.label",
	"globalThresholds.cpu": "pages.settings.form.thresholds.option.cpu.label",
	"globalThresholds.memory": "pages.settings.form.thresholds.option.memory.label",
	"globalThresholds.disk": "pages.settings.form.thresholds.option.disk.label",
	"globalThresholds.temperature":
		"pages.settings.form.thresholds.option.temperature.label",
	pagespeedApiKey: "pages.settings.form.pagespeed.option.apiKey.label",
	globalProxyEnabled: "pages.settings.form.globalProxy.option.enabled.label",
	showURL: "pages.settings.form.url.option.showURL.label",
	systemEmailHost: "pages.settings.form.email.option.host.label",
	systemEmailPort: "pages.settings.form.email.option.port.label",
	systemEmailAddress: "pages.settings.form.email.option.address.label",
	systemEmailDisplayName: "pages.settings.form.email.option.displayName.label",
	systemEmailUser: "pages.settings.form.email.option.user.label",
	systemEmailPassword: "pages.settings.form.email.option.password.label",
	systemEmailTLSServername: "pages.settings.form.email.option.tlsServername.label",
	systemEmailConnectionHost: "pages.settings.form.email.option.connectionHost.label",
	systemEmailSecure: "pages.settings.form.email.option.secure.label",
	systemEmailPool: "pages.settings.form.email.option.pool.label",
	systemEmailIgnoreTLS: "pages.settings.form.email.option.ignoreTLS.label",
	systemEmailRequireTLS: "pages.settings.form.email.option.requireTLS.label",
	systemEmailRejectUnauthorized:
		"pages.settings.form.email.option.rejectUnauthorized.label",
};

// react-hook-form nests errors by path, so a grouped field arrives as
// { globalThresholds: { cpu: { message } } }. Iterating the top level alone
// yields an entry whose own message is undefined, which renders as a bare
// "globalThresholds" naming none of the four sliders. Walk to the leaves.
type FieldErrorLeaf = { path: string; message?: string };

const flattenFieldErrors = (errors: unknown, prefix = ""): FieldErrorLeaf[] => {
	if (typeof errors !== "object" || errors === null) {
		return [];
	}
	return Object.entries(errors).flatMap(([key, value]) => {
		const path = prefix ? `${prefix}.${key}` : key;
		if (typeof value !== "object" || value === null) {
			return [];
		}
		const message = (value as { message?: unknown }).message;
		if (typeof message === "string") {
			return [{ path, message }];
		}
		const nested = flattenFieldErrors(value, path);
		return nested.length > 0 ? nested : [{ path }];
	});
};

export const SettingsPage = () => {
	const theme = useTheme();
	const { t, i18n } = useTranslation();
	const dispatch = useDispatch();
	const isAdmin = useIsAdmin();
	const { toastError } = useToast();
	const [searchParams, setSearchParams] = useSearchParams();

	const visibleTabs = useMemo(
		() => SETTINGS_TABS.filter((tab) => !("adminOnly" in tab) || isAdmin),
		[isAdmin]
	);

	// An unknown tab, or an admin tab requested by a non-admin, falls back to the
	// first tab the current user can actually see.
	const requestedTab = searchParams.get("tab");
	// visibleTabs always contains "general" today; the constant fallback keeps a
	// future gating change from throwing on an empty list.
	const firstVisibleTab: SettingsTabKey = visibleTabs[0]?.key ?? SETTINGS_TABS[0].key;
	const activeTab: SettingsTabKey =
		visibleTabs.find((tab) => tab.key === requestedTab)?.key ?? firstVisibleTab;

	const handleTabChange = (tab: SettingsTabKey) => {
		const updated = new URLSearchParams(searchParams);
		if (tab === firstVisibleTab) {
			updated.delete("tab");
		} else {
			updated.set("tab", tab);
		}
		setSearchParams(updated, { replace: true });
	};

	// A "tab" that does not resolve -- an unknown key, or an admin tab followed by
	// a non-admin -- leaves the URL claiming a tab the page is not showing. Drop it
	// so the address bar matches what is rendered.
	useEffect(() => {
		if (requestedTab !== null && requestedTab !== activeTab) {
			const updated = new URLSearchParams(searchParams);
			updated.delete("tab");
			setSearchParams(updated, { replace: true });
		}
	}, [requestedTab, activeTab, searchParams, setSearchParams]);

	// Local state for demo monitors dialog
	const [isDemoMonitorsDialogOpen, setIsDemoMonitorsDialogOpen] = useState(false);
	const { post: postDemoMonitors, loading: isPostingDemoMonitors } = usePost();
	const { deleteFn: deleteAllMonitors, loading: isDeletingAllMonitors } = useDelete();
	// Import monitors functionality
	const { post: importMonitors, loading: isImportingMonitors } = usePost();

	// Fetch settings data from API
	const { data: fetchedSettings } = useGet<AppSettingsResponse>("/settings");
	// Get proxies
	const { data: proxies } = useGet<ProxyResponse[]>("/proxies");
	const proxyOptions = useMemo(
		() =>
			(proxies ?? []).map((proxy) => ({
				value: proxy.id,
				label: `${proxy.name} (${proxy.host}:${proxy.port})`,
			})),
		[proxies]
	);

	// Form submission
	const { patch, loading: isSaving } = usePatch<SettingsFormData, AppSettingsResponse>();

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
	// Test email functionality
	const { post: sendTestEmail, loading: isSendingTestEmail } = usePost();
	// Local state for clear stats dialog
	const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
	const { deleteFn: deleteStats, loading: isDeletingStats } = useDelete();
	// Export monitors functionality
	const { get: fetchMonitorsJson } = useLazyGet();

	// Initialize form with schema and defaults
	const { schema, defaults } = useSettingsForm({ data: fetchedSettings?.settings });

	const emailSwitches: { name: FieldPath<SettingsFormInput>; label: string }[] = [
		{
			name: "systemEmailSecure",
			label: t("pages.settings.form.email.option.secure.label"),
		},
		{ name: "systemEmailPool", label: t("pages.settings.form.email.option.pool.label") },
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
	];

	const form = useForm<SettingsFormInput, unknown, SettingsFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
		mode: "onChange",
	});

	const { watch } = form;

	// Reset form when defaults change
	useEffect(() => {
		form.reset(defaults);
	}, [defaults, form]);

	// Update isApiKeySet when fetchedSettings changes
	useEffect(() => {
		if (fetchedSettings) {
			setIsApiKeySet(fetchedSettings.pagespeedKeySet);
			setIsEmailPasswordSet(fetchedSettings.emailPasswordSet);
		}
	}, [fetchedSettings]);

	const {
		timezone: selectedTimezoneId,
		mode,
		language = "en",
		chartType = "histogram",
	} = useSelector((state: RootState) => state.ui);

	const user = useSelector((state: RootState) => state.auth.user);

	const selectedTimezone =
		timezoneOptions.find((tz) => tz.id === selectedTimezoneId) ?? null;

	const handleTimezoneChange = (newValue: TimezoneOption | null) => {
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

		const result = await patch("/settings", dataToSend as SettingsFormData);

		if (result?.success) {
			// Update API key state from response
			if (result.data) {
				setIsApiKeySet(result.data.pagespeedKeySet);
				setApiKeyHasBeenReset(false);
				setIsEmailPasswordSet(result.data.emailPasswordSet);
				setEmailPasswordHasBeenReset(false);
			}
		}
	};

	const onError = (errors: unknown) => {
		logger.debug("Form validation errors", errors);
	};

	// The save bar lists errors by field name, and the offending field may sit on
	// a tab that is not open. Submitting cannot reveal it -- the button is
	// disabled while the form is invalid -- so each listed field switches to its
	// own tab instead.
	const revealField = (field: string) => {
		const target = tabForField(field);
		if (visibleTabs.some((tab) => tab.key === target)) {
			handleTabChange(target);
		}
	};

	const languages = Object.keys(i18n.options.resources || {});

	const globalProxyEnabled = watch("globalProxyEnabled");

	// Enabling the proxy with nothing selected preselects the first proxy
	useEffect(() => {
		if (
			globalProxyEnabled &&
			!form.getValues("globalProxyId") &&
			proxyOptions.length > 0
		) {
			form.setValue("globalProxyId", proxyOptions[0].value, {
				shouldValidate: true,
			});
		}
	}, [globalProxyEnabled, proxyOptions, form]);

	return (
		<FormProvider {...form}>
			<BasePage
				headerKey="settings"
				component="form"
				onSubmit={form.handleSubmit(onSubmit, onError)}
			>
				{visibleTabs.length > 1 && (
					<Tabs
						value={activeTab}
						onChange={(_, value: SettingsTabKey) => handleTabChange(value)}
					>
						{visibleTabs.map((tab) => (
							<Tab
								key={tab.key}
								value={tab.key}
								label={t(tab.labelKey)}
							/>
						))}
					</Tabs>
				)}

				{/* general tab */}
				{activeTab === "general" && (
					<Stack gap={theme.spacing(LAYOUT.MD)}>
						<ConfigBox
							title={t("pages.settings.form.timezone.title")}
							subtitle={t("pages.settings.form.timezone.description")}
							rightContent={
								<Autocomplete
									value={selectedTimezone}
									options={timezoneOptions}
									getOptionLabel={(option: TimezoneOption) => option.name}
									isOptionEqualToValue={(option: TimezoneOption, value: TimezoneOption) =>
										option.id === value.id
									}
									onChange={(_, newValue: TimezoneOption | null) => {
										handleTimezoneChange(newValue);
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
						{/* URL Settings */}
						<ConfigBox
							title={t("pages.settings.form.url.title")}
							subtitle={t("pages.settings.form.url.description")}
							rightContent={
								<FormSwitchField
									name="showURL"
									label={t("pages.settings.form.url.option.showURL.label")}
									labelPlacement="start"
								/>
							}
						/>
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
					</Stack>
				)}

				{/* monitoring tab */}
				{activeTab === "monitoring" && (
					<Stack gap={theme.spacing(LAYOUT.MD)}>
						{/* Global Thresholds */}
						{isAdmin && (
							<ConfigBox
								title={t("pages.settings.form.thresholds.title")}
								subtitle={t("pages.settings.form.thresholds.description")}
								rightContent={
									<Stack spacing={2}>
										<FormSliderField
											name="globalThresholds.cpu"
											fieldLabel={t("pages.settings.form.thresholds.option.cpu.label")}
											valueLabelDisplay="auto"
											min={1}
											max={100}
										/>
										<FormSliderField
											name="globalThresholds.memory"
											fieldLabel={t("pages.settings.form.thresholds.option.memory.label")}
											valueLabelDisplay="auto"
											min={1}
											max={100}
										/>
										<FormSliderField
											name="globalThresholds.disk"
											fieldLabel={t("pages.settings.form.thresholds.option.disk.label")}
											valueLabelDisplay="auto"
											min={1}
											max={100}
										/>

										<FormSliderField
											name="globalThresholds.temperature"
											fieldLabel={t(
												"pages.settings.form.thresholds.option.temperature.label"
											)}
											valueLabelDisplay="auto"
											min={1}
											max={150}
										/>
									</Stack>
								}
							/>
						)}
						{/* Check Retention */}
						{isAdmin && (
							<ConfigBox
								title={t("pages.settings.form.retention.title")}
								subtitle={t("pages.settings.form.retention.description")}
								rightContent={
									<FormSliderField
										name="checkTTL"
										fieldLabel={t("pages.settings.form.retention.option.days.label")}
										min={1}
										max={CHECK_TTL_SENTINEL}
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
					</Stack>
				)}

				{/* email tab */}
				{activeTab === "email" && (
					<Stack gap={theme.spacing(LAYOUT.MD)}>
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
																	name:
																		form.watch("systemEmailConnectionHost") ||
																		"localhost",
																	pool: form.watch("systemEmailPool") ?? false,
																	tls: {
																		rejectUnauthorized:
																			form.watch("systemEmailRejectUnauthorized") ?? true,
																		ignoreTLS:
																			form.watch("systemEmailIgnoreTLS") ?? false,
																		requireTLS:
																			form.watch("systemEmailRequireTLS") ?? false,
																		servername:
																			form.watch("systemEmailTLSServername") || "",
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
										<FormTextField
											name="systemEmailHost"
											fieldLabel={t("pages.settings.form.email.option.host.label")}
											placeholder={t("pages.settings.form.email.option.host.placeholder")}
										/>

										{/* Email Port */}
										<FormNumberField
											name="systemEmailPort"
											fieldLabel={t("pages.settings.form.email.option.port.label")}
											placeholder={t("pages.settings.form.email.option.port.placeholder")}
										/>

										{/* Email Address */}
										<FormTextField
											name="systemEmailAddress"
											type="email"
											fieldLabel={t("pages.settings.form.email.option.address.label")}
											placeholder={t(
												"pages.settings.form.email.option.address.placeholder"
											)}
										/>

										{/* Email Display Name (Optional) */}
										<FormTextField
											name="systemEmailDisplayName"
											fieldLabel={t("pages.settings.form.email.option.displayName.label")}
											placeholder={t(
												"pages.settings.form.email.option.displayName.placeholder"
											)}
										/>

										{/* Email User (Optional) */}
										<FormTextField
											name="systemEmailUser"
											fieldLabel={t("pages.settings.form.email.option.user.label")}
											placeholder={t("pages.settings.form.email.option.user.placeholder")}
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
											<FormTextField
												name="systemEmailPassword"
												type="password"
												fieldLabel={t("pages.settings.form.email.option.password.label")}
												placeholder={t(
													"pages.settings.form.email.option.password.placeholder"
												)}
											/>
										)}

										{/* TLS Servername (Optional) */}
										<FormTextField
											name="systemEmailTLSServername"
											fieldLabel={t(
												"pages.settings.form.email.option.tlsServername.label"
											)}
											placeholder={t(
												"pages.settings.form.email.option.tlsServername.placeholder"
											)}
										/>

										{/* Connection Host (Optional) */}
										<FormTextField
											name="systemEmailConnectionHost"
											fieldLabel={t(
												"pages.settings.form.email.option.connectionHost.label"
											)}
											placeholder={t(
												"pages.settings.form.email.option.connectionHost.placeholder"
											)}
										/>

										{/* Boolean Switches */}
										<Box
											display={"flex"}
											flexDirection={"column"}
											gap={theme.spacing(LAYOUT.XS)}
										>
											{emailSwitches.map(({ name, label }) => (
												<FormSwitchField
													key={name}
													name={name}
													label={label}
													labelPlacement="start"
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
					</Stack>
				)}

				{/* integrations tab */}
				{activeTab === "integrations" && (
					<Stack gap={theme.spacing(LAYOUT.MD)}>
						{isAdmin && (
							<ConfigBox
								title={t("pages.settings.form.globalProxy.title")}
								subtitle={t("pages.settings.form.globalProxy.description")}
								rightContent={
									proxyOptions.length > 0 ? (
										<Stack>
											<FormSwitchField
												name="globalProxyEnabled"
												labelPlacement="start"
												label={t("pages.settings.form.globalProxy.option.enabled.label")}
											/>
											{globalProxyEnabled && (
												<FormSelectField
													fieldLabel={t(
														"pages.settings.form.globalProxy.option.proxy.label"
													)}
													name="globalProxyId"
													options={proxyOptions}
												/>
											)}
										</Stack>
									) : (
										<TextLink
											text={t("pages.settings.form.globalProxy.option.empty.text")}
											linkText={t("pages.settings.form.globalProxy.option.empty.link")}
											href="/proxies"
										/>
									)
								}
							/>
						)}
						{isAdmin && (
							<ConfigBox
								title={t("pages.settings.form.pagespeed.title")}
								subtitle={t("pages.settings.form.pagespeed.description")}
								rightContent={
									<>
										{(isApiKeySet === false || apiKeyHasBeenReset === true) && (
											<FormTextField
												name="pagespeedApiKey"
												type="password"
												fieldLabel={t(
													"pages.settings.form.pagespeed.option.apiKey.label"
												)}
												placeholder={t(
													"pages.settings.form.pagespeed.option.apiKey.placeholder"
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
					</Stack>
				)}

				{/* data tab */}
				{activeTab === "data" && (
					<Stack gap={theme.spacing(LAYOUT.MD)}>
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
											onClick={() =>
												document.getElementById("monitor-import-input")?.click()
											}
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
					</Stack>
				)}

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
								{flattenFieldErrors(form.formState.errors).map(({ path, message }) => {
									const labelKey = FIELD_LABEL_KEY[path];
									// Labels read "Name - explanation"; keep the name.
									const label = labelKey ? t(labelKey).split(" - ")[0] : path;
									return (
										<li key={path}>
											<Typography variant="body2">
												<Link
													component="button"
													type="button"
													variant="body2"
													color={theme.palette.error.main}
													onClick={() => revealField(path)}
												>
													<strong>{label}</strong>
												</Link>
												{message ? `: ${message}` : ""}
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
		</FormProvider>
	);
};

export default SettingsPage;
