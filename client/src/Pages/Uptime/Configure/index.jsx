import { useNavigate, useParams } from "react-router";
import { useTheme } from "@emotion/react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import {
	Box,
	Stack,
	Tooltip,
	Typography,
	Button,
	FormControlLabel,
	Switch,
} from "@mui/material";
import { monitorValidation } from "../../../Validation/validation";
import { createToast } from "../../../Utils/toastUtils";
import { logger } from "../../../Utils/Logger";
import { useTranslation } from "react-i18next";
import ConfigBox from "../../../Components/ConfigBox";
import {
	updateUptimeMonitor,
	pauseUptimeMonitor,
	getUptimeMonitorById,
	deleteUptimeMonitor,
} from "../../../Features/UptimeMonitors/uptimeMonitorsSlice";
import TextInput from "../../../Components/Inputs/TextInput";
import { HttpAdornment } from "../../../Components/Inputs/TextInput/Adornments";
import PauseIcon from "../../../assets/icons/pause-icon.svg?react";
import ResumeIcon from "../../../assets/icons/resume-icon.svg?react";
import Select from "../../../Components/Inputs/Select";
import Checkbox from "../../../Components/Inputs/Checkbox";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import PulseDot from "../../../Components/Animated/PulseDot";
import SkeletonLayout from "./skeleton";
import "./index.css";
import Dialog from "../../../Components/Dialog";
import NotificationIntegrationModal from "../../../Components/NotificationIntegrationModal/Components/NotificationIntegrationModal";
import { usePauseMonitor } from "../../../Hooks/useMonitorControls";
import PauseOutlinedIcon from "@mui/icons-material/PauseOutlined";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import { useMonitorUtils } from "../../../Hooks/useMonitorUtils";

/**
 * Parses a URL string and returns a URL object.
 *
 * @param {string} url - The URL string to parse.
 * @returns {URL} - The parsed URL object if valid, otherwise an empty string.
 */
const parseUrl = (url) => {
	try {
		return new URL(url);
	} catch (error) {
		return null;
	}
};

/**
 * Configure page displays monitor configurations and allows for editing actions.
 * @component
 */
const Configure = () => {
	const MS_PER_MINUTE = 60000;
	const navigate = useNavigate();
	const theme = useTheme();
	const dispatch = useDispatch();
	const { user } = useSelector((state) => state.auth);
	const { isLoading } = useSelector((state) => state.uptimeMonitors);
	const [monitor, setMonitor] = useState({});
	const [errors, setErrors] = useState({});
	const { monitorId } = useParams();
	const idMap = {
		"monitor-url": "url",
		"monitor-name": "name",
		"monitor-checks-http": "type",
		"monitor-checks-ping": "type",
		"notify-email-default": "notification-email",
	};

	const matchMethodOptions = [
		{ _id: "equal", name: "Equal" },
		{ _id: "include", name: "Include" },
		{ _id: "regex", name: "Regex" },
	];

	const expectedValuePlaceholders = {
		regex: "^(success|ok)$",
		equal: "success",
		include: "ok",
	};

	const [trigger, setTrigger] = useState(false);
	const triggerUpdate = () => {
		setTrigger(!trigger);
	};
	const [pauseMonitor, isPausing, error] = usePauseMonitor({
		monitorId: monitor?._id,
		triggerUpdate,
	});

	useEffect(() => {
		const fetchMonitor = async () => {
			try {
				const action = await dispatch(getUptimeMonitorById({ monitorId }));
				if (getUptimeMonitorById.fulfilled.match(action)) {
					const monitor = action.payload.data;
					setMonitor(monitor);
				} else if (getUptimeMonitorById.rejected.match(action)) {
					throw new Error(action.error.message);
				}
			} catch (error) {
				logger.error("Error fetching monitor of id: " + monitorId);
				navigate("/not-found", { replace: true });
			}
		};
		fetchMonitor();
	}, [monitorId, navigate, trigger]);

	const handleChange = (event, name) => {
		let { checked, value, id } = event.target;
		if (!name) name = idMap[id];

		if (name.includes("notification-")) {
			name = name.replace("notification-", "");
			let hasNotif = monitor.notifications.some(
				(notification) => notification.type === name
			);
			setMonitor((prev) => {
				const notifs = [...prev.notifications];
				if (hasNotif) {
					return {
						...prev,
						notifications: notifs.filter((notif) => notif.type !== name),
					};
				} else {
					return {
						...prev,
						notifications: [
							...notifs,
							name === "email"
								? { type: name, address: value }
								: // TODO - phone number
									{ type: name, phone: value },
						],
					};
				}
			});
		} else {
			if (name === "interval") {
				value = value * MS_PER_MINUTE;
			}
			if (name === "ignoreTlsErrors") {
				value = checked;
			}
			setMonitor((prev) => ({
				...prev,
				[name]: value,
			}));

			const validation = monitorValidation.validate(
				{ [name]: value },
				{ abortEarly: false }
			);

			setErrors((prev) => {
				const updatedErrors = { ...prev };

				if (validation.error) updatedErrors[name] = validation.error.details[0].message;
				else delete updatedErrors[name];
				return updatedErrors;
			});
		}
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		const action = await dispatch(updateUptimeMonitor({ monitor: monitor }));
		if (action.meta.requestStatus === "fulfilled") {
			createToast({ body: "Monitor updated successfully!" });
		} else {
			createToast({ body: "Failed to update monitor." });
		}
	};

	const [isOpen, setIsOpen] = useState(false);
	const handleRemove = async (event) => {
		event.preventDefault();
		const action = await dispatch(deleteUptimeMonitor({ monitor }));
		if (action.meta.requestStatus === "fulfilled") {
			navigate("/uptime");
		} else {
			createToast({ body: "Failed to delete monitor." });
		}
	};

	const frequencies = [
		{ _id: 1, name: "1 minute" },
		{ _id: 2, name: "2 minutes" },
		{ _id: 3, name: "3 minutes" },
		{ _id: 4, name: "4 minutes" },
		{ _id: 5, name: "5 minutes" },
	];

	// Parse the URL
	const parsedUrl = parseUrl(monitor?.url);
	const protocol = parsedUrl?.protocol?.replace(":", "") || "";

	// Notification modal state
	const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

	const handleOpenNotificationModal = () => {
		setIsNotificationModalOpen(true);
	};

	const handleClosenNotificationModal = () => {
		setIsNotificationModalOpen(false);
	};

	const statusColor = {
		up: theme.palette.success.main,
		down: theme.palette.error.main,
		paused: theme.palette.error.main,
		pending: theme.palette.warning.main,
	};

	const { determineState } = useMonitorUtils();

	const { t } = useTranslation();

	return (
		<Stack
			className="configure-monitor"
			gap={theme.spacing(10)}
		>
			{Object.keys(monitor).length === 0 ? (
				<SkeletonLayout />
			) : (
				<>
					<Breadcrumbs
						list={[
							{ name: "uptime", path: "/uptime" },
							{ name: "details", path: `/uptime/${monitorId}` },
							{ name: "configure", path: `/uptime/configure/${monitorId}` },
						]}
					/>
					<Stack
						component="form"
						noValidate
						spellCheck="false"
						gap={theme.spacing(12)}
						flex={1}
					>
						<Stack
							direction="row"
							gap={theme.spacing(2)}
						>
							<Box>
								<Typography
									component="h1"
									variant="h1"
								>
									{monitor.name}
								</Typography>
								<Stack
									direction="row"
									alignItems="center"
									height="fit-content"
									gap={theme.spacing(2)}
								>
									<Tooltip
										title={t(`statusMsg.${[determineState(monitor)]}`)}
										disableInteractive
										slotProps={{
											popper: {
												modifiers: [
													{
														name: "offset",
														options: {
															offset: [0, -8],
														},
													},
												],
											},
										}}
									>
										<Box>
											<PulseDot color={statusColor[determineState(monitor)]} />
										</Box>
									</Tooltip>
									<Typography
										component="h2"
										variant="h2"
									>
										{monitor.url?.replace(/^https?:\/\//, "") || "..."}
									</Typography>
									<Typography
										position="relative"
										variant="body2"
										ml={theme.spacing(6)}
										mt={theme.spacing(1)}
										sx={{
											"&:before": {
												position: "absolute",
												content: `""`,
												width: 4,
												height: 4,
												borderRadius: "50%",
												backgroundColor: theme.palette.primary.contrastTextTertiary,
												opacity: 0.8,
												left: -10,
												top: "50%",
												transform: "translateY(-50%)",
											},
										}}
									>
										{t("editing")}
									</Typography>
								</Stack>
							</Box>
							<Box
								justifyContent="space-between"
								sx={{
									alignSelf: "flex-end",
									ml: "auto",
									display: "flex",
									gap: theme.spacing(2),
								}}
							>
								<Button
									variant="contained"
									color="secondary"
									loading={isPausing}
									startIcon={
										monitor?.isActive ? <PauseOutlinedIcon /> : <PlayArrowOutlinedIcon />
									}
									onClick={() => {
										pauseMonitor();
									}}
								>
									{monitor?.isActive ? t("pause") : t("resume")}
								</Button>
								<Button
									loading={isLoading}
									variant="contained"
									color="error"
									sx={{ px: theme.spacing(8) }}
									onClick={() => setIsOpen(true)}
								>
									{t("remove")}
								</Button>
							</Box>
						</Stack>
						<ConfigBox>
							<Box>
								<Typography component="h2">{t("settingsGeneralSettings")}</Typography>
								<Typography component="p">
									{t("distributedUptimeCreateSelectURL")}
								</Typography>
							</Box>
							<Stack gap={theme.spacing(20)}>
								<TextInput
									type={monitor?.type === "http" ? "url" : "text"}
									https={protocol === "https"}
									startAdornment={
										monitor?.type === "http" && (
											<HttpAdornment https={protocol === "https"} />
										)
									}
									id="monitor-url"
									label={t("urlMonitor")}
									placeholder="google.com"
									value={parsedUrl?.host || monitor?.url || ""}
									disabled={true}
								/>
								<TextInput
									type="number"
									id="monitor-port"
									label={t("portToMonitor")}
									placeholder="5173"
									value={monitor.port || ""}
									onChange={(event) => handleChange(event, "port")}
									error={errors["port"] ? true : false}
									helperText={errors["port"]}
									hidden={monitor.type !== "port"}
								/>
								<TextInput
									type="text"
									id="monitor-name"
									label={t("displayName")}
									isOptional={true}
									placeholder="Google"
									value={monitor?.name || ""}
									onChange={handleChange}
									error={errors["name"] ? true : false}
									helperText={errors["name"]}
								/>
							</Stack>
						</ConfigBox>
						<ConfigBox>
							<Box>
								<Typography component="h2">
									{t("distributedUptimeCreateIncidentNotification")}
								</Typography>
								<Typography component="p">
									{t("distributedUptimeCreateIncidentDescription")}
								</Typography>
							</Box>
							<Stack gap={theme.spacing(6)}>
								<Typography component="p">{t("whenNewIncident")}</Typography>
								{/* {Leaving components commented for future funtionality implimentation} */}
								{/* <Checkbox
									id="notify-sms"
									label="Notify via SMS (coming soon)"
									isChecked={false}
									value=""
									onChange={() => logger.warn("disabled")}
									isDisabled={true}
								/> */}
								<Checkbox
									id="notify-email-default"
									label={`Notify via email (to ${user.email})`}
									isChecked={
										monitor?.notifications?.some(
											(notification) => notification.type === "email"
										) || false
									}
									value={user?.email}
									onChange={(event) => handleChange(event)}
								/>
								<Box mt={theme.spacing(2)}>
									<Button
										variant="contained"
										color="accent"
										onClick={handleOpenNotificationModal}
									>
										{t("notifications.integrationButton")}
									</Button>
								</Box>
								{/* <Checkbox
									id="notify-email"
									label="Also notify via email to multiple addresses (coming soon)"
									isChecked={false}
									value=""
									onChange={() => logger.warn("disabled")}
									isDisabled={true}
								/> */}
								{/* {monitor?.notifications?.some(
									(notification) => notification.type === "emails"
								) ? (
									<Box mx={theme.spacing(16)}>
										<TextInput
											id="notify-email-list"
											type="text"
											placeholder="name@gmail.com"
											value=""
											onChange={() => logger.warn("disabled")}
										/>
										<Typography mt={theme.spacing(4)}>
											You can separate multiple emails with a comma
										</Typography>
									</Box>
								) : (
									""
								)} */}
							</Stack>
						</ConfigBox>
						<ConfigBox>
							<Box>
								<Typography component="h2">{t("ignoreTLSError")}</Typography>
								<Typography component="p">{t("ignoreTLSErrorDescription")}</Typography>
							</Box>
							<Stack>
								<FormControlLabel
									sx={{ marginLeft: 0 }}
									control={
										<Switch
											name="ignore-error"
											checked={monitor.ignoreTlsErrors}
											onChange={(event) => handleChange(event, "ignoreTlsErrors")}
											sx={{ mr: theme.spacing(2) }}
										/>
									}
									label={t("tlsErrorIgnored")}
								/>
							</Stack>
						</ConfigBox>
						<ConfigBox>
							<Box>
								<Typography component="h2">
									{t("distributedUptimeCreateAdvancedSettings")}
								</Typography>
							</Box>
							<Stack gap={theme.spacing(20)}>
								<Select
									id="monitor-interval-configure"
									label={t("checkFrequency")}
									value={monitor?.interval / MS_PER_MINUTE || 1}
									onChange={(event) => handleChange(event, "interval")}
									items={frequencies}
								/>
								{monitor.type === "http" && (
									<>
										<Select
											id="match-method"
											label={t("matchMethod")}
											value={monitor.matchMethod || "equal"}
											onChange={(event) => handleChange(event, "matchMethod")}
											items={matchMethodOptions}
										/>
										<Stack>
											<TextInput
												type="text"
												id="expected-value"
												label={t("expectedValue")}
												isOptional={true}
												placeholder={
													expectedValuePlaceholders[monitor.matchMethod || "equal"]
												}
												value={monitor.expectedValue}
												onChange={(event) => handleChange(event, "expectedValue")}
												error={errors["expectedValue"] ? true : false}
												helperText={errors["expectedValue"]}
											/>
											<Typography
												component="span"
												color={theme.palette.primary.contrastTextTertiary}
												opacity={0.8}
											>
												{t("uptimeCreate")}
											</Typography>
										</Stack>
										<Stack>
											<TextInput
												type="text"
												id="json-path"
												label="JSON Path"
												isOptional={true}
												placeholder="data.status"
												value={monitor.jsonPath}
												onChange={(event) => handleChange(event, "jsonPath")}
												error={errors["jsonPath"] ? true : false}
												helperText={errors["jsonPath"]}
											/>
											<Typography
												component="span"
												color={theme.palette.primary.contrastTextTertiary}
												opacity={0.8}
											>
												{t("uptimeCreateJsonPath")}&nbsp;
												<Typography
													component="a"
													href="https://jmespath.org/"
													target="_blank"
													color="info"
												>
													jmespath.org
												</Typography>
												&nbsp;{t("uptimeCreateJsonPathQuery")}
											</Typography>
										</Stack>
									</>
								)}
							</Stack>
						</ConfigBox>
						<Stack
							direction="row"
							justifyContent="flex-end"
							mt="auto"
						>
							<Button
								variant="contained"
								color="accent"
								loading={isLoading}
								sx={{ px: theme.spacing(12) }}
								onClick={handleSubmit}
							>
								{t("settingsSave")}
							</Button>
						</Stack>
					</Stack>
				</>
			)}

			<Dialog
				open={isOpen}
				theme={theme}
				title="Do you really want to delete this monitor?"
				description="Once deleted, this monitor cannot be retrieved."
				onCancel={() => setIsOpen(false)}
				confirmationButtonLabel="Delete"
				onConfirm={handleRemove}
				isLoading={isLoading}
			/>

			<NotificationIntegrationModal
				open={isNotificationModalOpen}
				onClose={handleClosenNotificationModal}
				monitor={monitor}
				setMonitor={setMonitor}
			/>
		</Stack>
	);
};

export default Configure;
