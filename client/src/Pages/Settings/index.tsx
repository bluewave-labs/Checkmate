import { BasePage, ConfigBox } from "@/Components/v2/design-elements";
import { Autocomplete, Select } from "@/Components/v2/inputs";
import { Stack, useTheme, MenuItem, type SelectChangeEvent } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import DummyChart from "@/Pages/Settings/DummyChart";
import { useGet } from "@/Hooks/UseApi";
import { useSettingsForm } from "@/Hooks/useSettingsForm";
import { useIsAdmin } from "@/Hooks/useIsAdmin.js";
import type { SettingsFormData } from "@/Validation/settings";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { TextField, Button } from "@/Components/v2/inputs";
import { Typography, Box } from "@mui/material";

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

	// Fetch settings data from API
	const { data: fetchedSettings } = useGet<SettingsResponse>("/settings");

	// Local state for API key reset
	const [isApiKeySet, setIsApiKeySet] = useState(
		fetchedSettings?.pagespeedKeySet ?? false
	);
	const [apiKeyHasBeenReset, setApiKeyHasBeenReset] = useState(false);

	// Initialize form with schema and defaults
	const { schema, defaults } = useSettingsForm({ data: fetchedSettings?.settings });

	const form = useForm<SettingsFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
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

	const languages = Object.keys(i18n.options.resources || {});

	return (
		<BasePage component="form">
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
										<Typography sx={{ mb: theme.spacing(4) }}>
											{t("pages.settings.pageSpeedSettings.labelApiKeySet")}
										</Typography>
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
				<Stack
					direction="row"
					justifyContent="flex-end"
				>
					<Button
						loading={false}
						type="submit"
						variant="contained"
						color="primary"
					>
						{t("common.buttons.save")}
					</Button>
				</Stack>
			</Stack>
		</BasePage>
	);
};

export default SettingsPage;
