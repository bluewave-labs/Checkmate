import { BasePage, ConfigBox } from "@/Components/v2/design-elements";
import { Autocomplete, Select, Dialog } from "@/Components/v2/inputs";
import { Stack, useTheme, MenuItem, type SelectChangeEvent } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import DummyChart from "@/Pages/Settings/DummyChart";
import { useGet, usePatch, usePost } from "@/Hooks/UseApi";
import { useSettingsForm } from "@/Hooks/useSettingsForm";
import { useIsAdmin } from "@/Hooks/useIsAdmin.js";
import type { SettingsFormData } from "@/Validation/settings";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { TextField, Button, FieldLabel } from "@/Components/v2/inputs";
import { Box } from "@mui/material";
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

interface Timezone {
	id: string;
	name: string;
}

interface SettingsResponse {
	settings: any;
	pagespeedKeySet: boolean;
	emailPasswordSet: boolean;
}

export const SettingsPage = () => {
	const theme = useTheme();
	const { t, i18n } = useTranslation();
	const dispatch = useDispatch();
	const isAdmin = useIsAdmin();
	// Local state for demo monitors dialog
	const [isDemoMonitorsDialogOpen, setIsDemoMonitorsDialogOpen] = useState(false);
	const { post: postDemoMonitors, loading: isPostingDemoMonitors } = usePost();
	const { deleteFn: deleteAllMonitors, loading: isDeletingAllMonitors } = useDelete();

	// Fetch settings data from API
	const { data: fetchedSettings } = useGet<SettingsResponse>("/settings");
	// Form submission
	const { patch, loading: isSaving } = usePatch<SettingsFormData, SettingsResponse>();

	// Local state for API key reset
	const [isApiKeySet, setIsApiKeySet] = useState(
		fetchedSettings?.pagespeedKeySet ?? false
	);
	const [apiKeyHasBeenReset, setApiKeyHasBeenReset] = useState(false);
	// Local state for clear stats dialog
	const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
	const { deleteFn: deleteStats, loading: isDeletingStats } = useDelete();

	// Initialize form with schema and defaults
	const { schema, defaults } = useSettingsForm({ data: fetchedSettings?.settings });

	const form = useForm<SettingsFormData>({
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
		}
	}, [fetchedSettings]);

	const {
		timezone: selectedTimezoneId,
		mode,
		language = "en",
		chartType = "histogram",
	} = useSelector((state: RootState) => state.ui);

	// Convert timezones to match AutoComplete format (id instead of _id)
	const timezoneOptions: Timezone[] = timezones.map((tz) => ({
		id: tz._id,
		name: tz.name,
	}));

	const selectedTimezone =
		timezoneOptions.find((tz) => tz.id === selectedTimezoneId) ?? null;

	const handleTimezoneChange = (newValue: Timezone | null) => {
		const newId = newValue?.id ?? "";
		dispatch(setTimezone({ timezone: newId }));
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

	const handleClearStats = async () => {
		await deleteStats("/checks/team");
		setIsStatsDialogOpen(false);
	};

	const onSubmit = async (data: SettingsFormData) => {
		// Don't send pagespeedApiKey if it's already set and user hasn't clicked reset
		const dataToSend = { ...data };
		if (isApiKeySet && !apiKeyHasBeenReset) {
			delete (dataToSend as any).pagespeedApiKey;
		}

		// Convert undefined to empty string for backend unsetting
		const processedData = Object.entries(dataToSend).reduce((acc, [key, value]) => {
			const typedKey = key as keyof SettingsFormData;
			if (value === undefined) {
				(acc as any)[typedKey] = "";
			} else if (typeof value === "object" && value !== null) {
				// Handle nested objects like globalThresholds
				// Convert 0 to "" for unsetting thresholds
				(acc as any)[typedKey] = Object.entries(value).reduce(
					(nested, [nestedKey, nestedValue]) => ({
						...nested,
						[nestedKey]:
							nestedValue === undefined || nestedValue === 0 ? "" : nestedValue,
					}),
					{}
				);
			} else {
				(acc as any)[typedKey] = value;
			}
			return acc;
		}, {} as Partial<SettingsFormData>);

		const result = await patch("/settings", processedData as SettingsFormData);

		if (result?.success) {
			// Update API key state from response
			if (result.data) {
				setIsApiKeySet(result.data.pagespeedKeySet);
				setApiKeyHasBeenReset(false);
			}
		}
	};

	const onError = (errors: unknown) => {
		console.log("Form validation errors:", errors);
	};

	const languages = Object.keys(i18n.options.resources || {});

	return (
		<BasePage
			component="form"
			onSubmit={form.handleSubmit(onSubmit, onError)}
		>
			<Stack gap={theme.spacing(8)}>
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
						<Stack gap={theme.spacing(8)}>
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
										{lang.toUpperCase()}
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
									render={({ field, fieldState }) => (
										<TextField
											{...field}
											value={
												field.value === undefined || field.value === 0 ? "" : field.value
											}
											onChange={(e) => {
												const val = e.target.value;
												field.onChange(val === "" ? 0 : Number(val));
											}}
											fieldLabel={t("pages.settings.form.thresholds.option.cpu.label")}
											type="number"
											inputProps={{ min: 0 }}
											placeholder={t(
												"pages.settings.form.thresholds.option.cpu.placeholder"
											)}
											error={!!fieldState.error}
											helperText={fieldState.error?.message}
										/>
									)}
								/>
								<Controller
									name="globalThresholds.memory"
									control={form.control}
									defaultValue={defaults.globalThresholds?.memory}
									render={({ field, fieldState }) => (
										<TextField
											{...field}
											value={
												field.value === undefined || field.value === 0 ? "" : field.value
											}
											onChange={(e) => {
												const val = e.target.value;
												field.onChange(val === "" ? 0 : Number(val));
											}}
											fieldLabel={t("pages.settings.form.thresholds.option.memory.label")}
											type="number"
											inputProps={{ min: 0 }}
											placeholder={t(
												"pages.settings.form.thresholds.option.memory.placeholder"
											)}
											error={!!fieldState.error}
											helperText={fieldState.error?.message}
										/>
									)}
								/>
								<Controller
									name="globalThresholds.disk"
									control={form.control}
									defaultValue={defaults.globalThresholds?.disk}
									render={({ field, fieldState }) => (
										<TextField
											{...field}
											value={
												field.value === undefined || field.value === 0 ? "" : field.value
											}
											onChange={(e) => {
												const val = e.target.value;
												field.onChange(val === "" ? 0 : Number(val));
											}}
											fieldLabel={t("pages.settings.form.thresholds.option.disk.label")}
											type="number"
											inputProps={{ min: 0 }}
											placeholder={t(
												"pages.settings.form.thresholds.option.disk.placeholder"
											)}
											error={!!fieldState.error}
											helperText={fieldState.error?.message}
										/>
									)}
								/>
								<Controller
									name="globalThresholds.temperature"
									control={form.control}
									defaultValue={defaults.globalThresholds?.temperature}
									render={({ field, fieldState }) => (
										<TextField
											{...field}
											value={
												field.value === undefined || field.value === 0 ? "" : field.value
											}
											onChange={(e) => {
												const val = e.target.value;
												field.onChange(val === "" ? 0 : Number(val));
											}}
											fieldLabel={t(
												"pages.settings.form.thresholds.option.temperature.label"
											)}
											type="number"
											inputProps={{ min: 0 }}
											placeholder={t(
												"pages.settings.form.thresholds.option.temperature.placeholder"
											)}
											error={!!fieldState.error}
											helperText={fieldState.error?.message}
										/>
									)}
								/>
							</Stack>
						}
					/>
				)}
			</Stack>

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
			/>

			{/* Sticky Save Button */}
			<Stack
				direction="row"
				justifyContent="flex-end"
				sx={{
					position: "sticky",
					bottom: 0,
					backgroundColor: theme.palette.background.paper,
					borderTop: `1px solid ${theme.palette.divider}`,
					padding: theme.spacing(8),
					marginLeft: theme.spacing(-8),
					marginRight: theme.spacing(-8),
					marginBottom: theme.spacing(-8),
					zIndex: 1000,
				}}
			>
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
