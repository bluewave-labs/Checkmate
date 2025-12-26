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
import SettingsTwilio from "./SettingsTwilio";
import SettingsGlobalThresholds from "./SettingsGlobalThresholds.jsx";
import SettingsExport from "./SettingsExport.jsx";
import Button from "@mui/material/Button";
// Utils
import { settingsValidation } from "../../../Validation/validation.js";
import { useState } from "react";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import {
	setTimezone,
	setMode,
	setLanguage,
	setShowURL,
} from "../../../Features/UI/uiSlice.js";
import SettingsStats from "./SettingsStats.jsx";

import { useFetchSettings, useSaveSettings } from "../../../Hooks/v1/settingsHooks.js";
import { useIsAdmin } from "../../../Hooks/v1/useIsAdmin.js";
import {
	useAddDemoMonitors,
	useDeleteAllMonitors,
	useDeleteMonitorStats,
	useFetchJson,
} from "../../../Hooks/v1/monitorHooks.js";
// Constants
const BREADCRUMBS = [{ name: `Settings`, path: "/settings" }];

const Settings = () => {
	// Redux state
	const { mode, language, timezone, showURL } = useSelector((state) => state.ui);

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
	const [isSettingsLoading, settingsError] = useFetchSettings({
		setSettingsData,
		setIsApiKeySet,
		setIsEmailPasswordSet,
	});

	const [addDemoMonitors, isAddingDemoMonitors] = useAddDemoMonitors();

	const [isSaving, saveError, saveSettings] = useSaveSettings({
		setSettingsData,
		setIsApiKeySet,
		setApiKeyHasBeenReset,
		setIsEmailPasswordSet,
		setEmailPasswordHasBeenReset,
	});
	const [deleteAllMonitors, isDeletingMonitors] = useDeleteAllMonitors();
	const [deleteMonitorStats, isDeletingMonitorStats] = useDeleteMonitorStats();
	const [fetchJson, isFetchingJson] = useFetchJson();

	// Setup
	const isAdmin = useIsAdmin();
	const theme = useTheme();
	const HEADING_SX = { mt: theme.spacing(2), mb: theme.spacing(2) };
	const { t } = useTranslation();
	const dispatch = useDispatch();
	// Handlers
	const handleChange = async (e) => {
		const { name, value, checked } = e.target;

		// Special case for showURL until handled properly in the backend
		if (name === "showURL") {
			dispatch(setShowURL(value));
			return;
		}
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

		if (name === "deleteStats") {
			await deleteMonitorStats();
			return;
		}

		if (name === "demo") {
			await addDemoMonitors();
			return;
		}

		if (name === "deleteMonitors") {
			await deleteAllMonitors();
			return;
		}

		if (name === "export") {
			const json = await fetchJson();
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

		// Validate
		const { error } = settingsValidation.validate(newSettingsData.settings, {
			abortEarly: false,
		});
		if (!error || error.details.length === 0) {
			setErrors({});
		} else {
			const newErrors = {};
			error.details.forEach((err) => {
				newErrors[err.path[0]] = err.message;
			});
			setErrors(newErrors);
		}

		setSettingsData(newSettingsData);
	};

	const handleSave = () => {
		const { error } = settingsValidation.validate(settingsData.settings, {
			abortEarly: false,
		});
		if (!error || error.details.length === 0) {
			setErrors({});
		} else {
			const newErrors = {};
			error.details.forEach((err) => {
				newErrors[err.path[0]] = err.message;
			});

			setErrors(newErrors);
		}
		saveSettings(settingsData?.settings);
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

			<SettingsTwilio
				isAdmin={isAdmin}
				HEADER_SX={HEADING_SX}
				handleChange={handleChange}
				settingsData={settingsData}
				setSettingsData={setSettingsData}
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
