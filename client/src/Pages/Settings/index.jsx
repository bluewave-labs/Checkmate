import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "@/Components/v1/Breadcrumbs/index.jsx";
import SettingsTimeZone from "./SettingsTimeZone.jsx";
import SettingsUI from "./SettingsUI.jsx";
import SettingsURL from "./SettingsURL.jsx";
import SettingsPagespeed from "./SettingsPagespeed.jsx";
import SettingsDemoMonitors from "./SettingsDemoMonitors.jsx";
import SettingsAbout from "./SettingsAbout.jsx";
import SettingsEmail from "./SettingsEmail.jsx";
import SettingsGlobalThresholds from "./SettingsGlobalThresholds.jsx";
import SettingsExport from "./SettingsExport.jsx";
import Button from "@mui/material/Button";
// Utils
import { settingsValidation } from "@/Validation/validation.js";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSettingsForm } from "@/Hooks/useSettingsForm.js";
import { useState, useEffect } from "react";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";

import SettingsStats from "./SettingsStats.jsx";

import { useIsAdmin } from "@/Hooks/useIsAdmin.js";
import { useGet, usePost, useDelete, useLazyGet, usePatch } from "@/Hooks/UseApi";
// Constants
const BREADCRUMBS = [{ name: `Settings`, path: "/settings" }];

const Settings = () => {
	const { data: fetchedSettings, isLoading: isSettingsLoading } = useGet("/settings");
	// Local state
	const [errors, setErrors] = useState({});
	const [isApiKeySet, setIsApiKeySet] = useState(
		fetchedSettings?.pagespeedKeySet ?? false
	);
	const [apiKeyHasBeenReset, setApiKeyHasBeenReset] = useState(false);
	const [isEmailPasswordSet, setIsEmailPasswordSet] = useState(
		fetchedSettings?.emailPasswordSet ?? false
	);
	const [emailPasswordHasBeenReset, setEmailPasswordHasBeenReset] = useState(false);

	// Network

	const { schema, defaults } = useSettingsForm({ data: fetchedSettings?.settings });
	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});
	const {
		control,
		watch,
		reset,
		handleSubmit,
		clearErrors,
		trigger,
		getValues,
		setValue,
		formState: { dirtyFields },
	} = form;
	useEffect(() => {
		reset(defaults);
	}, [defaults, reset]);

	useEffect(() => {
		if (fetchedSettings) {
			setIsApiKeySet(fetchedSettings?.pagespeedKeySet);
			setIsEmailPasswordSet(fetchedSettings?.emailPasswordSet);
		}
	}, [fetchedSettings]);

	const { patch: saveSettingsFn, loading: isSaving } = usePatch();

	const saveSettings = async (settings) => {
		const response = await saveSettingsFn("/settings", settings);
		if (response?.data) {
			const data = response.data;
			setIsApiKeySet(data.pagespeedKeySet);
			setIsEmailPasswordSet(data.emailPasswordSet);
			if (data.pagespeedKeySet === true) {
				setApiKeyHasBeenReset(false);
			}
			if (data.emailPasswordSet === true) {
				setEmailPasswordHasBeenReset(false);
			}
		}
	};

	const onSubmit = async (data) => {
		const toSubmit = { ...data };
		if (!form.formState.dirtyFields.systemEmailPassword) {
			delete toSubmit.systemEmailPassword;
		}
		if (!form.formState.dirtyFields.pagespeedApiKey) {
			delete toSubmit.pagespeedApiKey;
		}
		saveSettings(toSubmit);
	};

	// New API hooks to replace monitorHooks
	const { loading: isAddingDemoMonitors } = usePost();
	const { loading: isDeletingMonitors } = useDelete();
	const { loading: isDeletingMonitorStats } = useDelete();
	const { get: fetchJson, loading: isFetchingJson } = useLazyGet();

	// Setup
	const isAdmin = useIsAdmin();
	const theme = useTheme();
	const HEADING_SX = { mt: theme.spacing(2), mb: theme.spacing(2) };
	const { t } = useTranslation();
	const dispatch = useDispatch();

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<Typography variant="h1">{t("settingsPage.title")}</Typography>
			<SettingsTimeZone HEADING_SX={HEADING_SX} />
			<SettingsUI HEADING_SX={HEADING_SX} />
			<SettingsPagespeed
				isAdmin={isAdmin}
				HEADING_SX={HEADING_SX}
				isApiKeySet={isApiKeySet}
				apiKeyHasBeenReset={apiKeyHasBeenReset}
				setApiKeyHasBeenReset={setApiKeyHasBeenReset}
				control={control}
				defaults={defaults}
				setValue={setValue}
			/>
			<SettingsURL
				HEADING_SX={HEADING_SX}
				control={control}
				defaults={defaults}
			/>
			<SettingsStats
				isAdmin={isAdmin}
				HEADING_SX={HEADING_SX}
				errors={errors}
			/>
			<SettingsGlobalThresholds
				isAdmin={isAdmin}
				HEADING_SX={HEADING_SX}
				control={control}
				defaults={defaults}
			/>

			<SettingsDemoMonitors
				isAdmin={isAdmin}
				HEADER_SX={HEADING_SX}
				isLoading={
					isSettingsLoading || isSaving || isDeletingMonitorStats || isAddingDemoMonitors
				}
			/>
			<SettingsEmail
				isAdmin={isAdmin}
				HEADER_SX={HEADING_SX}
				isEmailPasswordSet={isEmailPasswordSet}
				emailPasswordHasBeenReset={emailPasswordHasBeenReset}
				setEmailPasswordHasBeenReset={setEmailPasswordHasBeenReset}
				control={control}
				defaults={defaults}
				formValues={watch()}
				setValue={setValue}
			/>

			<SettingsExport
				isAdmin={isAdmin}
				HEADER_SX={HEADING_SX}
				isLoading={isSettingsLoading || isSaving || isFetchingJson}
			/>
			<SettingsAbout />
			<Stack
				direction="row"
				justifyContent="flex-end"
				sx={{
					position: "sticky",
					bottom: 0,
					boxShadow: theme.shape.boxShadow,
					zIndex: 1000,
					mt: 3,
					backgroundColor: theme.palette.primary.main,
					display: "flex",
					justifyContent: "flex-end",
					pb: theme.spacing(4),
					pr: theme.spacing(15),
					pl: theme.spacing(5),
					pt: theme.spacing(4),
					border: 1,
					borderStyle: "solid",
					borderColor: theme.palette.primary.lowContrast,
					borderRadius: theme.spacing(2),
				}}
			>
				<Button
					loading={
						isSaving || isDeletingMonitorStats || isSettingsLoading || isDeletingMonitors
					}
					disabled={Object.keys(errors).length > 0}
					variant="contained"
					color="accent"
					sx={{ px: theme.spacing(12), py: theme.spacing(8) }}
					onClick={handleSubmit(onSubmit)}
				>
					{t("settingsPage.saveButtonLabel")}
				</Button>
			</Stack>
		</Stack>
	);
};

export default Settings;
