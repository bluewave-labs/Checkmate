import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "../../Components/Breadcrumbs";
import SettingsTimeZone from "./SettingsTimeZone";
import SettingsUI from "./SettingsUI";
import SettingsPagespeed from "./SettingsPagespeed";
import SettingsDemoMonitors from "./SettingsDemoMonitors";
import SettingsAbout from "./SettingsAbout";
import Button from "@mui/material/Button";
// Utils
import { settingsValidation } from "../../Validation/validation";
import { createToast } from "../../Utils/toastUtils";
import { useState } from "react";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { setTimezone, setMode, setLanguage } from "../../Features/UI/uiSlice";
import { getAppSettings } from "../../Features/Settings/settingsSlice";
import SettingsStats from "./SettingsStats";
import {
	deleteMonitorChecksByTeamId,
	addDemoMonitors,
	deleteAllMonitors,
} from "../../Features/UptimeMonitors/uptimeMonitorsSlice";
import { useFetchSettings, useSaveSettings } from "../../Hooks/useFetchSettings";
import { UseDeleteMonitorStats } from "../../Hooks/useDeleteMonitorStats";

// Constants
const BREADCRUMBS = [{ name: `Settings`, path: "/settings" }];

const Settings = () => {
	// Redux state
	const { mode, language, timezone } = useSelector((state) => state.ui);
	const { user } = useSelector((state) => state.auth);

	// Local state
	const [settings, setSettings] = useState({});
	const [errors, setErrors] = useState({});

	// Network
	const [isSettingsLoading, settingsError] = useFetchSettings({
		settings,
		setSettings,
	});

	const [isSaving, saveError, saveSettings] = useSaveSettings();

	const [deleteMonitorStats, isDeletingMonitorStats] = UseDeleteMonitorStats();

	// Setup
	const theme = useTheme();
	const HEADING_SX = { mt: theme.spacing(2), mb: theme.spacing(2) };
	const { t, i18n } = useTranslation();
	const dispatch = useDispatch();

	// Handlers
	const handleChange = async (e) => {
		const { name, value } = e.target;

		// Build next state early
		const newSettings = { ...settings, [name]: value };

		// Validate
		const { error } = settingsValidation.validate(newSettings, { abortEarly: false });
		if (!error || error.details.length === 0) {
			setErrors({});
		} else {
			const newErrors = {};
			error.details.forEach((err) => {
				newErrors[err.path[0]] = err.message;
			});
			setErrors(newErrors);
		}

		if (name === "timezone") {
			dispatch(setTimezone({ timezone: value }));
		}

		if (name === "mode") {
			dispatch(setMode(value));
		}

		if (name === "language") {
			dispatch(setLanguage(value));
			i18n.changeLanguage(value);
		}

		if (name === "deleteStats") {
			await deleteMonitorStats({ teamId: user.teamId });
			return;
		}

		if (name === "demo") {
			try {
				const action = await dispatch(addDemoMonitors());
				if (addDemoMonitors.fulfilled.match(action)) {
					createToast({ body: t("settingsDemoMonitorsAdded") });
				} else {
					createToast({ body: t("settingsFailedToAddDemoMonitors") });
				}
			} catch (error) {
				createToast({ body: t("settingsFailedToAddDemoMonitors") });
			}
			return;
		}

		if (name === "deleteMonitors") {
			try {
				const action = await dispatch(deleteAllMonitors());
				if (deleteAllMonitors.fulfilled.match(action)) {
					createToast({ body: t("settingsMonitorsDeleted") });
				} else {
					createToast({ body: t("settingsFailedToDeleteMonitors") });
				}
			} catch (error) {
				createToast({ body: t("settingsFailedToDeleteMonitors") });
			}
			return;
		}

		setSettings(newSettings);
	};

	const handleSave = () => {
		const { error } = settingsValidation.validate(settings, { abortEarly: false });
		if (!error || error.details.length === 0) {
			setErrors({});
		} else {
			const newErrors = {};
			error.details.forEach((err) => {
				newErrors[err.path[0]] = err.message;
			});
			setErrors(newErrors);
		}
		saveSettings(settings);
	};

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<Typography variant="h1">Settings</Typography>
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
				HEADING_SX={HEADING_SX}
				settings={settings}
				setSettings={setSettings}
			/>
			<SettingsStats
				HEADING_SX={HEADING_SX}
				settings={settings}
				setSettings={setSettings}
				handleChange={handleChange}
				errors={errors}
			/>
			<SettingsDemoMonitors
				isLoading={false}
				authIsLoading={false}
				checksIsLoading={false}
				handleChange={handleChange}
			/>
			<SettingsAbout />
			<Stack
				direction="row"
				justifyContent="flex-end"
			>
				<Button
					loading={isSaving || isDeletingMonitorStats || isSettingsLoading}
					disabled={Object.keys(errors).length > 0}
					variant="contained"
					color="accent"
					sx={{ px: theme.spacing(12), mt: theme.spacing(20) }}
					onClick={handleSave}
				>
					{t("settingsSave")}
				</Button>
			</Stack>
		</Stack>
	);
};

export default Settings;
