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
		reset(defaults, { keepDirtyValues: false });
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
		// Convert undefined to empty strings for proper unsetting on backend
		const toSubmit = Object.fromEntries(
			Object.entries(data).map(([key, value]) => {
				if (value === undefined) return [key, ""];
				if (typeof value === "object" && value !== null) {
					// Handle nested objects like globalThresholds
					return [
						key,
						Object.fromEntries(
							Object.entries(value).map(([k, v]) => [k, v === undefined ? "" : v])
						),
					];
				}
				return [key, value];
			})
		);

		// Handle password field:
		// - If emailPasswordHasBeenReset is true, ALWAYS include (even if empty to unset)
		// - Otherwise, only include if dirty (user typed something)
		if (emailPasswordHasBeenReset) {
			// Keep password field (even if empty) to allow unsetting
			// toSubmit.systemEmailPassword is already in toSubmit
		} else if (!form.formState.dirtyFields.systemEmailPassword) {
			// Not in reset mode and not dirty -> exclude (no changes)
			delete toSubmit.systemEmailPassword;
		}

		// Handle API key field (same logic)
		if (apiKeyHasBeenReset) {
			// Keep API key field (even if empty) to allow unsetting
		} else if (!form.formState.dirtyFields.pagespeedApiKey) {
			// Not in reset mode and not dirty -> exclude (no changes)
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
			<Typography variant="h1">{t("pages.settings.title")}</Typography>
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
					disabled={!form.formState.isValid}
					variant="contained"
					color="accent"
					sx={{ px: theme.spacing(12), py: theme.spacing(8) }}
					onClick={handleSubmit(onSubmit)}
				>
					{t("pages.settings.saveButtonLabel")}
				</Button>
			</Stack>
		</Stack>
	);
};

export default Settings;
