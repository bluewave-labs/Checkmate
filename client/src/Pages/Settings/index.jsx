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
import { useState, useEffect } from "react";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import {
	setTimezone,
	setMode,
	setLanguage,
	setShowURL,
	setChartType,
} from "@/Features/UI/uiSlice.js";
import SettingsStats from "./SettingsStats.jsx";

import { useIsAdmin } from "@/Hooks/useIsAdmin.js";
import { useGet, usePost, useDelete, useLazyGet, usePatch } from "@/Hooks/UseApi";
// Constants
const BREADCRUMBS = [{ name: `Settings`, path: "/settings" }];

const Settings = () => {
	// Redux state
	const {
		mode,
		language = "en",
		timezone,
		showURL,
		chartType = "histogram",
	} = useSelector((state) => state.ui);

	// Local state
	const [settingsData, setSettingsData] = useState({});
	const [errors, setErrors] = useState({});
	const [isApiKeySet, setIsApiKeySet] = useState(settingsData?.pagespeedKeySet ?? false);
	const [apiKeyHasBeenReset, setApiKeyHasBeenReset] = useState(false);
	const [isEmailPasswordSet, setIsEmailPasswordSet] = useState(
		settingsData?.emailPasswordSet ?? false
	);
	const [emailPasswordHasBeenReset, setEmailPasswordHasBeenReset] = useState(false);

	// Network
	const { data: fetchedSettings, isLoading: isSettingsLoading } = useGet("/settings");

	useEffect(() => {
		if (fetchedSettings) {
			setSettingsData(fetchedSettings);
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
			setSettingsData(data);
		}
	};

	// New API hooks to replace monitorHooks
	const { post: postDemoMonitors, loading: isAddingDemoMonitors } = usePost();
	const { deleteFn: deleteAllMonitorsFn, loading: isDeletingMonitors } = useDelete();
	const { deleteFn: deleteMonitorStatsFn, loading: isDeletingMonitorStats } = useDelete();
	const { get: fetchJson, loading: isFetchingJson } = useLazyGet();

	// Setup
	const isAdmin = useIsAdmin();
	const theme = useTheme();
	const HEADING_SX = { mt: theme.spacing(2), mb: theme.spacing(2) };
	const { t } = useTranslation();
	const dispatch = useDispatch();
	// Handlers
	const handleChange = async (e) => {
		const { name, value, checked } = e.target;

		let newValue;
		if (
			name === "systemEmailIgnoreTLS" ||
			name === "systemEmailRequireTLS" ||
			name === "systemEmailRejectUnauthorized" ||
			name === "systemEmailSecure" ||
			name === "systemEmailPool"
		) {
			newValue = checked;
		}

		// Ensure showURL is a proper boolean
		if (name === "showURL") {
			newValue = value === true || value === "true";
		}

		// Build next state early
		const newSettingsData = {
			...settingsData,
			settings: { ...settingsData.settings, [name]: newValue ?? value },
		};

		if (name === "timezone") {
			dispatch(setTimezone({ timezone: value }));
			return;
		}

		if (name === "mode") {
			dispatch(setMode(value));
			return;
		}

		if (name === "language") {
			dispatch(setLanguage(value));
			return;
		}

		if (name === "chartType") {
			dispatch(setChartType(value));
			return;
		}

		if (name === "deleteStats") {
			await deleteMonitorStatsFn("/checks/team");
			return;
		}

		if (name === "demo") {
			await postDemoMonitors("/monitors/demo", {});
			return;
		}

		if (name === "deleteMonitors") {
			await deleteAllMonitorsFn("/monitors/");
			return;
		}

		if (name === "export") {
			const res = await fetchJson("/monitors/export/json");
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
			return;
		}

		setSettingsData(newSettingsData);

		// Update Redux immediately for UI feedback
		if (name === "showURL") {
			dispatch(setShowURL(newValue));
		}
	};

	const handleSave = () => {
		// Validate]

		const toSubmit = {
			checkTTL: settingsData.settings.checkTTL,
			pagespeedApiKey: settingsData.settings.pagespeedApiKey,
			language: settingsData.settings.language,
			timezone: settingsData.settings.timezone,
			systemEmailHost: settingsData.settings.systemEmailHost,
			systemEmailPort: settingsData.settings.systemEmailPort,
			systemEmailSecure: settingsData.settings.systemEmailSecure,
			systemEmailPool: settingsData.settings.systemEmailPool,
			systemEmailAddress: settingsData.settings.systemEmailAddress,
			systemEmailPassword: settingsData.settings.systemEmailPassword,
			systemEmailUser: settingsData.settings.systemEmailUser,
			systemEmailConnectionHost: settingsData.settings.systemEmailConnectionHost,
			systemEmailTLSServername: settingsData.settings.systemEmailTLSServername,
			systemEmailIgnoreTLS: settingsData.settings.systemEmailIgnoreTLS,
			systemEmailRequireTLS: settingsData.settings.systemEmailRequireTLS,
			systemEmailRejectUnauthorized: settingsData.settings.systemEmailRejectUnauthorized,
			showURL: settingsData.settings.showURL,
			globalThresholds: settingsData.settings.globalThresholds,
		};

		const { error } = settingsValidation.validate(toSubmit, {
			abortEarly: false,
		});
		if (!error || error.details.length === 0) {
			setErrors({});
			saveSettings(toSubmit);
		} else {
			const newErrors = {};
			error.details.forEach((err) => {
				newErrors[err.path[0]] = err.message;
			});
			setErrors(newErrors);
		}
	};

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<Typography variant="h1">{t("settingsPage.title")}</Typography>
			<SettingsTimeZone
				HEADING_SX={HEADING_SX}
				handleChange={handleChange}
				timezone={timezone}
			/>
			<SettingsUI
				HEADING_SX={HEADING_SX}
				handleChange={handleChange}
				mode={mode}
				language={language}
				chartType={chartType}
			/>
			<SettingsPagespeed
				isAdmin={isAdmin}
				HEADING_SX={HEADING_SX}
				settingsData={settingsData}
				setSettingsData={setSettingsData}
				isApiKeySet={isApiKeySet}
				apiKeyHasBeenReset={apiKeyHasBeenReset}
				setApiKeyHasBeenReset={setApiKeyHasBeenReset}
			/>
			<SettingsURL
				HEADING_SX={HEADING_SX}
				handleChange={handleChange}
				showURL={showURL}
			/>
			<SettingsStats
				isAdmin={isAdmin}
				HEADING_SX={HEADING_SX}
				settingsData={settingsData}
				handleChange={handleChange}
				errors={errors}
			/>
			<SettingsGlobalThresholds
				isAdmin={isAdmin}
				HEADING_SX={HEADING_SX}
				settingsData={settingsData}
				setSettingsData={setSettingsData}
			/>

			<SettingsDemoMonitors
				isAdmin={isAdmin}
				HEADER_SX={HEADING_SX}
				handleChange={handleChange}
				isLoading={
					isSettingsLoading || isSaving || isDeletingMonitorStats || isAddingDemoMonitors
				}
			/>
			<SettingsEmail
				isAdmin={isAdmin}
				HEADER_SX={HEADING_SX}
				handleChange={handleChange}
				settingsData={settingsData}
				setSettingsData={setSettingsData}
				isEmailPasswordSet={isEmailPasswordSet}
				emailPasswordHasBeenReset={emailPasswordHasBeenReset}
				setEmailPasswordHasBeenReset={setEmailPasswordHasBeenReset}
			/>

			<SettingsExport
				isAdmin={isAdmin}
				HEADER_SX={HEADING_SX}
				handleChange={handleChange}
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
					onClick={handleSave}
				>
					{t("settingsPage.saveButtonLabel")}
				</Button>
			</Stack>
		</Stack>
	);
};

export default Settings;
