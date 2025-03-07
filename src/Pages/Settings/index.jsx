// Components
import { Box, Stack, Typography, Button, Switch } from "@mui/material";
import TextInput from "../../Components/Inputs/TextInput";
import Link from "../../Components/Link";
import Select from "../../Components/Inputs/Select";
import { useIsAdmin } from "../../Hooks/useIsAdmin";
import Dialog from "../../Components/Dialog";
import ConfigBox from "../../Components/ConfigBox";
import {
	WalletMultiButton,
	WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";

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
} from "../../Features/UI/uiSlice";
import timezones from "../../Utils/timezones.json";
import { useState, useEffect } from "react";
import { networkService } from "../../main";
import { settingsValidation } from "../../Validation/validation";

// Constants
const SECONDS_PER_DAY = 86400;

const Settings = () => {
	const theme = useTheme();
	const isAdmin = useIsAdmin();
	const { user } = useSelector((state) => state.auth);
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
			const action = await dispatch(update({ localData: updatedUser }));

			if (action.payload.success) {
				createToast({
					body: "Settings saved successfully",
				});
			} else {
				if (action.payload) {
					// dispatch errors
					createToast({
						body: action.payload.msg,
					});
				} else {
					// unknown errors
					createToast({
						body: "Unknown error.",
					});
				}
			}
		} catch (error) {
			console.log(error);
			createToast({ body: "Failed to save settings" });
		} finally {
			setChecksIsLoading(false);
		}
	};

	const handleClearStats = async () => {
		try {
			const action = await dispatch(
				deleteMonitorChecksByTeamId({ teamId: user.teamId })
			);

			if (deleteMonitorChecksByTeamId.fulfilled.match(action)) {
				createToast({ body: "Stats cleared successfully" });
			} else {
				createToast({ body: "Failed to clear stats" });
			}
		} catch (error) {
			logger.error(error);
			createToast({ body: "Failed to clear stats" });
		} finally {
			setIsOpen(deleteStatsMonitorsInitState);
		}
	};

	const handleInsertDemoMonitors = async () => {
		try {
			const action = await dispatch(addDemoMonitors());
			if (addDemoMonitors.fulfilled.match(action)) {
				createToast({ body: "Successfully added demo monitors" });
			} else {
				createToast({ body: "Failed to add demo monitors" });
			}
		} catch (error) {
			logger.error(error);
			createToast({ Body: "Failed to add demo monitors" });
		}
	};

	const handleDeleteAllMonitors = async () => {
		try {
			const action = await dispatch(deleteAllMonitors());
			if (deleteAllMonitors.fulfilled.match(action)) {
				createToast({ body: "Successfully deleted all monitors" });
			} else {
				createToast({ body: "Failed to add demo monitors" });
			}
		} catch (error) {
			logger.error(error);
			createToast({ Body: "Failed to delete all monitors" });
		} finally {
			setIsOpen(deleteStatsMonitorsInitState);
		}
	};

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
						<Typography component="h1">General settings</Typography>
						<Typography sx={{ mt: theme.spacing(2), mb: theme.spacing(2) }}>
							<Typography component="span">Display timezone</Typography>- The timezone of
							the dashboard you publicly display.
						</Typography>
					</Box>
					<Stack gap={theme.spacing(20)}>
						<Select
							id="display-timezones"
							label="Display timezone"
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
						<Typography component="h1">Appearance</Typography>
						<Typography sx={{ mt: theme.spacing(2), mb: theme.spacing(2) }}>
							Switch between light and dark mode.
						</Typography>
					</Box>
					<Stack gap={theme.spacing(20)}>
						<Select
							id="theme-mode"
							label="Theme Mode"
							value={mode}
							onChange={(e) => {
								dispatch(setMode(e.target.value));
							}}
							items={[
								{ _id: "light", name: "Light" },
								{ _id: "dark", name: "Dark" },
							]}
						></Select>
					</Stack>
				</ConfigBox>
				{isAdmin && (
					<ConfigBox>
						<Box>
							<Typography component="h1">Distributed uptime</Typography>
							<Typography sx={{ mt: theme.spacing(2), mb: theme.spacing(2) }}>
								Enable/disable distributed uptime monitoring.
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
							{distributedUptimeEnabled === true ? "Enabled" : "Disabled"}
						</Box>
					</ConfigBox>
				)}
				{isAdmin && (
					<ConfigBox>
						<Box>
							<Typography component="h1">History and monitoring</Typography>
							<Typography sx={{ mt: theme.spacing(2) }}>
								Define here for how long you want to keep the data. You can also remove
								all past data.
							</Typography>
						</Box>
						<Stack gap={theme.spacing(20)}>
							<TextInput
								id="ttl"
								label="The days you want to keep monitoring history."
								optionalLabel="0 for infinite"
								value={form.ttl}
								onChange={handleChange}
								error={errors.ttl ? true : false}
								helperText={errors.ttl}
							/>
							<Box>
								<Typography>Clear all stats. This is irreversible.</Typography>
								<Button
									variant="contained"
									color="error"
									onClick={() =>
										setIsOpen({ ...deleteStatsMonitorsInitState, deleteStats: true })
									}
									sx={{ mt: theme.spacing(4) }}
								>
									Clear all stats
								</Button>
							</Box>
						</Stack>
						<Dialog
							open={isOpen.deleteStats}
							theme={theme}
							title="Do you want to clear all stats?"
							description="Once deleted, your monitors cannot be retrieved."
							onCancel={() => setIsOpen(deleteStatsMonitorsInitState)}
							confirmationButtonLabel="Yes, clear all stats"
							onConfirm={handleClearStats}
							isLoading={isLoading || authIsLoading || checksIsLoading}
						/>
					</ConfigBox>
				)}
				{isAdmin && (
					<ConfigBox>
						<Box>
							<Typography component="h1">Demo monitors</Typography>
							<Typography sx={{ mt: theme.spacing(2) }}>
								Here you can add and remove demo monitors.
							</Typography>
						</Box>
						<Stack gap={theme.spacing(20)}>
							<Box>
								<Typography>Add demo monitors</Typography>
								<Button
									variant="contained"
									color="accent"
									loading={isLoading || authIsLoading || checksIsLoading}
									onClick={handleInsertDemoMonitors}
									sx={{ mt: theme.spacing(4) }}
								>
									Add demo monitors
								</Button>
							</Box>
							<Box>
								<Typography>Remove all monitors</Typography>
								<Button
									variant="contained"
									color="error"
									loading={isLoading || authIsLoading || checksIsLoading}
									onClick={() =>
										setIsOpen({ ...deleteStatsMonitorsInitState, deleteMonitors: true })
									}
									sx={{ mt: theme.spacing(4) }}
								>
									Remove all monitors
								</Button>
							</Box>
						</Stack>
						<Dialog
							open={isOpen.deleteMonitors}
							theme={theme}
							title="Do you want to remove all monitors?"
							onCancel={() => setIsOpen(deleteStatsMonitorsInitState)}
							confirmationButtonLabel="Yes, clear all monitors"
							onConfirm={handleDeleteAllMonitors}
							isLoading={isLoading || authIsLoading || checksIsLoading}
						/>
					</ConfigBox>
				)}
				{isAdmin && (
					<ConfigBox>
						<Box>
							<Typography component="h1">Wallet</Typography>
							<Typography sx={{ mt: theme.spacing(2) }}>
								Connect your wallet here. This is required for the Distributed Uptime
								monitor to connect to multiple nodes globally.
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 2 }}>
							<Stack
								direction="row"
								spacing={2}
							>
								<WalletMultiButton />
								<WalletDisconnectButton />
							</Stack>
						</Box>
					</ConfigBox>
				)}


				<ConfigBox>
					<Box>
						<Typography component="h1">About</Typography>
					</Box>
					<Box>
						<Typography component="h2">Checkmate {version}</Typography>
						<Typography sx={{ mt: theme.spacing(2), mb: theme.spacing(6), opacity: 0.6 }}>
							Developed by Bluewave Labs.
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
						Save
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
