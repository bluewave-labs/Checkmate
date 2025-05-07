// Components
import { Box, Stack, Typography, Button, Switch } from "@mui/material";
import TextInput from "../../Components/Inputs/TextInput";
import Link from "../../Components/Link";
import Select from "../../Components/Inputs/Select";
import { useIsAdmin } from "../../Hooks/useIsAdmin";
import Dialog from "../../Components/Dialog";
import ConfigBox from "../../Components/ConfigBox";
// import {
// 	WalletMultiButton,
// 	WalletDisconnectButton,
// } from "@solana/wallet-adapter-react-ui";

//Utils
import { useTheme } from "@emotion/react";
import { logger } from "../../Utils/Logger";
import { useDispatch, useSelector } from "react-redux";
import { createToast } from "../../Utils/toastUtils";
import {
	deleteMonitorChecksByTeamId,
	addDemoMonitors,
	deleteAllMonitors,
} from "../../Features/UptimeMonitors/uptimeMonitorsSlice";
import { update } from "../../Features/Auth/authSlice";
import PropTypes from "prop-types";
import {
	setTimezone,
	setMode,
	setDistributedUptimeEnabled,
	setLanguage,
} from "../../Features/UI/uiSlice";
import timezones from "../../Utils/timezones.json";
import { useState, useEffect } from "react";
import { networkService } from "../../main";
import { settingsValidation } from "../../Validation/validation";
import { updateAppSettings } from "../../Features/Settings/settingsSlice";
import { useTranslation } from "react-i18next";

// Constants
const SECONDS_PER_DAY = 86400;

const Settings = () => {
	const theme = useTheme();
	const { t, i18n } = useTranslation();
	const isAdmin = useIsAdmin();
	const { user } = useSelector((state) => state.auth);
	const { language } = useSelector((state) => state.ui);
	const { checkTTL } = user;
	const { isLoading } = useSelector((state) => state.uptimeMonitors);
	const { isLoading: authIsLoading } = useSelector((state) => state.auth);
	const { timezone, distributedUptimeEnabled } = useSelector((state) => state.ui);
	const { mode } = useSelector((state) => state.ui);
	const [checksIsLoading, setChecksIsLoading] = useState(false);
	const [form, setForm] = useState({
		enableDistributedUptime: distributedUptimeEnabled,
		ttl: checkTTL ? (checkTTL / SECONDS_PER_DAY).toString() : 0,
	});
	const [version, setVersion] = useState("unknown");
	const [errors, setErrors] = useState({});
	const deleteStatsMonitorsInitState = { deleteMonitors: false, deleteStats: false };
	const [isOpen, setIsOpen] = useState(deleteStatsMonitorsInitState);
	const dispatch = useDispatch();

	//Fetching latest release version from github
	useEffect(() => {
		const fetchLatestVersion = async () => {
			let version = "unknown";
			try {
				const response = await networkService.fetchGithubLatestRelease();
				if (!response.status === 200) {
					throw new Error("Failed to fetch latest version");
				}
				version = response.data.tag_name;
			} catch (error) {
				createToast({ body: error.message || "Error fetching latest version" }); // Set error message
			} finally {
				setVersion(version);
			}
		};
		fetchLatestVersion();
	}, []);

	const handleChange = (event) => {
		const { type, checked, value, id } = event.target;

		if (type === "checkbox") {
			setForm((prev) => ({
				...prev,
				[id]: checked,
			}));
			return;
		}

		const { error } = settingsValidation.validate(
			{ [id]: value },
			{
				abortEarly: false,
			}
		);
		if (!error || error.details.length === 0) {
			setErrors({});
		} else {
			const newErrors = {};
			error.details.forEach((err) => {
				newErrors[err.path[0]] = err.message;
			});
			setErrors(newErrors);
			logger.error("Validation errors:", error.details);
		}
		let inputValue = value;
		id === "ttl" && (inputValue = value.replace(/[^0-9]/g, ""));
		setForm((prev) => ({
			...prev,
			[id]: inputValue,
		}));
	};

	// TODO Handle saving
	const handleSave = async () => {
		try {
			setChecksIsLoading(true);
			await networkService.updateChecksTTL({
				ttl: form.ttl,
			});
			const updatedUser = { ...user, checkTTL: form.ttl };
			const [userAction, settingsAction] = await Promise.all([
				dispatch(update({ localData: updatedUser })),
				dispatch(updateAppSettings({ settings: { language: language } })),
			]);

			if (userAction.payload.success && settingsAction.payload.success) {
				createToast({ body: t("settingsSuccessSaved") });
			} else {
				throw new Error("Failed to save settings");
			}
		} catch (error) {
			createToast({ body: t("settingsFailedToSave") });
		} finally {
			setChecksIsLoading(false);
		}
	};

	const handleClearStats = async () => {
		try {
			const action = await dispatch(deleteMonitorChecksByTeamId({ teamId: user.teamId }));

			if (deleteMonitorChecksByTeamId.fulfilled.match(action)) {
				createToast({ body: t("settingsStatsCleared") });
			} else {
				createToast({ body: t("settingsFailedToClearStats") });
			}
		} catch (error) {
			logger.error(error);
			createToast({ body: t("settingsFailedToClearStats") });
		} finally {
			setIsOpen(deleteStatsMonitorsInitState);
		}
	};

	const handleInsertDemoMonitors = async () => {
		try {
			const action = await dispatch(addDemoMonitors());
			if (addDemoMonitors.fulfilled.match(action)) {
				createToast({ body: t("settingsDemoMonitorsAdded") });
			} else {
				createToast({ body: t("settingsFailedToAddDemoMonitors") });
			}
		} catch (error) {
			logger.error(error);
			createToast({ Body: t("settingsFailedToAddDemoMonitors") });
		}
	};

	const handleDeleteAllMonitors = async () => {
		try {
			const action = await dispatch(deleteAllMonitors());
			if (deleteAllMonitors.fulfilled.match(action)) {
				createToast({ body: t("settingsMonitorsDeleted") });
			} else {
				createToast({ body: t("settingsFailedToDeleteMonitors") });
			}
		} catch (error) {
			logger.error(error);
			createToast({ Body: t("settingsFailedToDeleteMonitors") });
		} finally {
			setIsOpen(deleteStatsMonitorsInitState);
		}
	};

	const languages = Object.keys(i18n.options.resources || {});

	return (
		<Box
			className="settings"
			style={{
				paddingBottom: 0,
			}}
		>
			<Stack
				component="form"
				gap={theme.spacing(12)}
				noValidate
				spellCheck="false"
			>
				<ConfigBox>
					<Box>
						<Typography component="h1">{t("settingsGeneralSettings")}</Typography>
						<Typography sx={{ mt: theme.spacing(2), mb: theme.spacing(2) }}>
							<Typography component="span">{t("settingsDisplayTimezone")}</Typography>-{" "}
							{t("settingsDisplayTimezoneDescription")}
						</Typography>
					</Box>
					<Stack gap={theme.spacing(20)}>
						<Select
							id="display-timezones"
							label={t("settingsDisplayTimezone")}
							value={timezone}
							onChange={(e) => {
								dispatch(setTimezone({ timezone: e.target.value }));
							}}
							items={timezones}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography component="h1">{t("settingsAppearance")}</Typography>
						<Typography sx={{ mt: theme.spacing(2), mb: theme.spacing(2) }}>
							{t("settingsAppearanceDescription")}
						</Typography>
					</Box>
					<Stack gap={theme.spacing(20)}>
						<Select
							id="theme-mode"
							label={t("settingsThemeMode")}
							value={mode}
							onChange={(e) => {
								dispatch(setMode(e.target.value));
							}}
							items={[
								{ _id: "light", name: "Light" },
								{ _id: "dark", name: "Dark" },
							]}
						></Select>
						<Select
							id="language"
							label={t("settingsLanguage")}
							value={language}
							onChange={(e) => {
								dispatch(setLanguage(e.target.value));
								i18n.changeLanguage(e.target.value);
							}}
							items={languages.map((lang) => ({ _id: lang, name: lang.toUpperCase() }))}
						></Select>
					</Stack>
				</ConfigBox>
				{/* {isAdmin && (
					<ConfigBox>
						<Box>
							<Typography component="h1">{t("settingsDistributedUptime")}</Typography>
							<Typography sx={{ mt: theme.spacing(2), mb: theme.spacing(2) }}>
								{t("settingsDistributedUptimeDescription")}
							</Typography>
						</Box>
						<Box>
							<Switch
								id="enableDistributedUptime"
								color="accent"
								checked={distributedUptimeEnabled}
								onChange={(e) => {
									dispatch(setDistributedUptimeEnabled(e.target.checked));
								}}
							/>
							{distributedUptimeEnabled === true
								? t("settingsEnabled")
								: t("settingsDisabled")}
						</Box>
					</ConfigBox>
				)} */}
				{/* {isAdmin && (
					<ConfigBox>
						<Box>
							<Typography component="h1">{t("settingsWallet")}</Typography>
							<Typography sx={{ mt: theme.spacing(2) }}>
								{t("settingsWalletDescription")}
							</Typography>
						</Box>
						<Box
							sx={{
								display: "flex",
								flexWrap: "wrap",
								justifyContent: "flex-start",
								gap: 2,
							}}
						>
							<Stack
								direction="row"
								spacing={2}
							>
								<WalletMultiButton />
								<WalletDisconnectButton />
							</Stack>
						</Box>
					</ConfigBox>
				)} */}
				{isAdmin && (
					<ConfigBox>
						<Box>
							<Typography component="h1">{t("settingsHistoryAndMonitoring")}</Typography>
							<Typography sx={{ mt: theme.spacing(2) }}>
								{t("settingsHistoryAndMonitoringDescription")}
							</Typography>
						</Box>
						<Stack gap={theme.spacing(20)}>
							<TextInput
								id="ttl"
								label={t("settingsTTLLabel")}
								optionalLabel={t("settingsTTLOptionalLabel")}
								value={form.ttl}
								onChange={handleChange}
								error={errors.ttl ? true : false}
								helperText={errors.ttl}
							/>
							<Box>
								<Typography>{t("settingsClearAllStats")}</Typography>
								<Button
									variant="contained"
									color="error"
									onClick={() =>
										setIsOpen({ ...deleteStatsMonitorsInitState, deleteStats: true })
									}
									sx={{ mt: theme.spacing(4) }}
								>
									{t("settingsClearAllStatsButton")}
								</Button>
							</Box>
						</Stack>
						<Dialog
							open={isOpen.deleteStats}
							theme={theme}
							title={t("settingsClearAllStatsDialogTitle")}
							description={t("settingsClearAllStatsDialogDescription")}
							onCancel={() => setIsOpen(deleteStatsMonitorsInitState)}
							confirmationButtonLabel={t("settingsClearAllStatsDialogConfirm")}
							onConfirm={handleClearStats}
							isLoading={isLoading || authIsLoading || checksIsLoading}
						/>
					</ConfigBox>
				)}
				{isAdmin && (
					<>
						{/* Demo Monitors Section */}
						<ConfigBox>
							<Box>
								<Typography component="h1">{t("settingsDemoMonitors")}</Typography>
								<Typography sx={{ mt: theme.spacing(2) }}>
									{t("settingsDemoMonitorsDescription")}
								</Typography>
							</Box>
							<Box>
								<Typography>{t("settingsAddDemoMonitors")}</Typography>
								<Button
									variant="contained"
									color="accent"
									loading={isLoading || authIsLoading || checksIsLoading}
									onClick={handleInsertDemoMonitors}
									sx={{ mt: theme.spacing(4) }}
								>
									{t("settingsAddDemoMonitorsButton")}
								</Button>
							</Box>
						</ConfigBox>

						{/* System Reset Section */}
						<ConfigBox>
							<Box>
								<Typography component="h1">{t("settingsSystemReset")}</Typography>
								<Typography sx={{ mt: theme.spacing(2) }}>
									{t("settingsSystemResetDescription")}
								</Typography>
							</Box>
							<Box>
								<Typography>{t("settingsRemoveAllMonitors")}</Typography>
								<Button
									variant="contained"
									color="error"
									loading={isLoading || authIsLoading || checksIsLoading}
									onClick={() =>
										setIsOpen({ ...deleteStatsMonitorsInitState, deleteMonitors: true })
									}
									sx={{ mt: theme.spacing(4) }}
								>
									{t("settingsRemoveAllMonitorsButton")}
								</Button>
							</Box>
							<Dialog
								open={isOpen.deleteMonitors}
								theme={theme}
								title={t("settingsRemoveAllMonitorsDialogTitle")}
								onCancel={() => setIsOpen(deleteStatsMonitorsInitState)}
								confirmationButtonLabel={t("settingsRemoveAllMonitorsDialogConfirm")}
								onConfirm={handleDeleteAllMonitors}
								isLoading={isLoading || authIsLoading || checksIsLoading}
							/>
						</ConfigBox>
					</>
				)}

				<ConfigBox>
					<Box>
						<Typography component="h1">{t("settingsAbout")}</Typography>
					</Box>
					<Box>
						<Typography component="h2">Checkmate {version}</Typography>
						<Typography sx={{ mt: theme.spacing(2), mb: theme.spacing(6), opacity: 0.6 }}>
							{t("settingsDevelopedBy")}
						</Typography>
						<Link
							level="secondary"
							url="https://github.com/bluewave-labs/checkmate"
							label="https://github.com/bluewave-labs/checkmate"
						/>
					</Box>
				</ConfigBox>
				<Stack
					direction="row"
					justifyContent="flex-end"
				>
					<Button
						loading={isLoading || authIsLoading || checksIsLoading}
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
		</Box>
	);
};

Settings.propTypes = {
	isAdmin: PropTypes.bool,
};
export default Settings;
