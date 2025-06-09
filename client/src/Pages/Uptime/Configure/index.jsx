import { useNavigate, useParams } from "react-router";
import { useTheme } from "@emotion/react";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
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
import { useTranslation } from "react-i18next";
import ConfigBox from "../../../Components/ConfigBox";
import {
	updateUptimeMonitor,
	deleteUptimeMonitor,
} from "../../../Features/UptimeMonitors/uptimeMonitorsSlice";
import TextInput from "../../../Components/Inputs/TextInput";
import { HttpAdornment } from "../../../Components/Inputs/TextInput/Adornments";
import Select from "../../../Components/Inputs/Select";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import PulseDot from "../../../Components/Animated/PulseDot";
import "./index.css";
import Dialog from "../../../Components/Dialog";
import { usePauseMonitor } from "../../../Hooks/useMonitorControls";
import PauseOutlinedIcon from "@mui/icons-material/PauseOutlined";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import { useMonitorUtils } from "../../../Hooks/useMonitorUtils";
import { useFetchUptimeMonitorById } from "../../../Hooks/useFetchUptimeMonitorById";
import { useGetNotificationsByTeamId } from "../../../Hooks/useNotifications";
import NotificationsConfig from "../../../Components/NotificationConfig";

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
	const { monitorId } = useParams();

	// Local state
	const [form, setForm] = useState({
		ignoreTlsErrors: false,
		interval: 60000,
		matchMethod: "equal",
		expectedValue: "",
		jsonPath: "",
		notifications: [],
		port: "",
		type: "http",
	});
	const [useAdvancedMatching, setUseAdvancedMatching] = useState(false);
	const [updateTrigger, setUpdateTrigger] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [errors, setErrors] = useState({});

	const triggerUpdate = () => {
		setUpdateTrigger(!updateTrigger);
	};

	// Network
	const [monitor, isLoading, error] = useFetchUptimeMonitorById(monitorId, updateTrigger);
	const [notifications, notificationsAreLoading, notificationsError] =
		useGetNotificationsByTeamId();
	const [pauseMonitor, isPausing, pauseError] = usePauseMonitor({
		monitorId: monitor?._id,
		triggerUpdate,
	});

	const MS_PER_MINUTE = 60000;
	const navigate = useNavigate();
	const theme = useTheme();
	const dispatch = useDispatch();

	const matchMethodOptions = [
		{ _id: "equal", name: "Equal" },
		{ _id: "include", name: "Include" },
		{ _id: "regex", name: "Regex" },
	];

	const frequencies = [
		{ _id: 1, name: "1 minute" },
		{ _id: 2, name: "2 minutes" },
		{ _id: 3, name: "3 minutes" },
		{ _id: 4, name: "4 minutes" },
		{ _id: 5, name: "5 minutes" },
	];

	const expectedValuePlaceholders = {
		regex: "^(success|ok)$",
		equal: "success",
		include: "ok",
	};

	// Handlers
	const handlePause = async () => {
		const res = await pauseMonitor();
		if (typeof res !== "undefined") {
			triggerUpdate();
		}
	};

	const handleRemove = async (event) => {
		event.preventDefault();
		const action = await dispatch(deleteUptimeMonitor({ monitor }));
		if (action.meta.requestStatus === "fulfilled") {
			navigate("/uptime");
		} else {
			createToast({ body: "Failed to delete monitor." });
		}
	};

	const onChange = (event) => {
		let { name, value, checked } = event.target;

		if (name === "ignoreTlsErrors") {
			value = checked;
		}

		if (name === "interval") {
			value = value * MS_PER_MINUTE;
		}
		setForm({ ...form, [name]: value });

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
	};

	const onSubmit = async (e) => {
		e.preventDefault();

		const toSubmit = {
			_id: form._id,
			url: form.url,
			name: form.name,
			type: form.type,
			matchMethod: form.matchMethod,
			expectedValue: form.expectedValue,
			jsonPath: form.jsonPath,
			interval: form.interval,
			teamId: form.teamId,
			userId: form.userId,
			port: form.port,
			ignoreTlsErrors: form.ignoreTlsErrors,
		};

		if (!useAdvancedMatching) {
			toSubmit.matchMethod = "";
			toSubmit.expectedValue = "";
			toSubmit.jsonPath = "";
		}

		const validation = monitorValidation.validate(toSubmit, {
			abortEarly: false,
		});

		if (validation.error) {
			const newErrors = {};
			error.details.forEach((err) => {
				newErrors[err.path[0]] = err.message;
			});
			setErrors(newErrors);
			createToast({ body: "Please check the form for errors." });
			return;
		}

		toSubmit.notifications = form.notifications;
		const action = await dispatch(updateUptimeMonitor({ monitor: toSubmit }));
		if (action.meta.requestStatus === "fulfilled") {
			createToast({ body: "Monitor updated successfully!" });
		} else {
			createToast({ body: "Failed to update monitor." });
		}
	};

	// Effects
	useEffect(() => {
		if (monitor?.matchMethod) {
			setUseAdvancedMatching(true);
		}

		setForm({
			...monitor,
		});
	}, [monitor, notifications]);

	// Parse the URL
	const parsedUrl = parseUrl(monitor?.url);
	const protocol = parsedUrl?.protocol?.replace(":", "") || "";

	const { determineState, statusColor } = useMonitorUtils();

	const { t } = useTranslation();

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs
				list={[
					{ name: "uptime", path: "/uptime" },
					{ name: "details", path: `/uptime/${monitorId}` },
					{ name: "configure", path: `/uptime/configure/${monitorId}` },
				]}
			/>
			<Stack
				component="form"
				onSubmit={onSubmit}
				noValidate
				spellCheck="false"
				gap={theme.spacing(12)}
				flex={1}
			>
				<Stack
					direction="row"
					gap={theme.spacing(12)}
				>
					<Box>
						<Typography
							component="h1"
							variant="monitorName"
						>
							{form.name}
						</Typography>
						<Stack
							direction="row"
							alignItems="center"
							height="fit-content"
							gap={theme.spacing(2)}
						>
							<Tooltip
								title={t(`statusMsg.${[determineState(form)]}`)}
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
									<PulseDot color={statusColor[determineState(form)]} />
								</Box>
							</Tooltip>
							<Typography
								component="h2"
								variant="monitorUrl"
							>
								{form.url?.replace(/^https?:\/\//, "") || "..."}
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
								form?.isActive ? <PauseOutlinedIcon /> : <PlayArrowOutlinedIcon />
							}
							onClick={handlePause}
						>
							{form?.isActive ? t("pause") : t("resume")}
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
						<Typography
							component="h2"
							variant="h2"
						>
							{t("settingsGeneralSettings")}
						</Typography>
						<Typography component="p">{t("distributedUptimeCreateSelectURL")}</Typography>
					</Box>
					<Stack gap={theme.spacing(20)}>
						<TextInput
							type={form?.type === "http" ? "url" : "text"}
							https={protocol === "https"}
							startAdornment={
								form?.type === "http" && <HttpAdornment https={protocol === "https"} />
							}
							id="monitor-url"
							label={t("urlMonitor")}
							placeholder="google.com"
							value={parsedUrl?.host || form?.url || ""}
							disabled={true}
						/>
						<TextInput
							name="port"
							type="number"
							label={t("portToMonitor")}
							placeholder="5173"
							value={form.port || ""}
							onChange={onChange}
							error={errors["port"] ? true : false}
							helperText={errors["port"]}
							hidden={form.type !== "port"}
						/>
						<TextInput
							name="name"
							type="text"
							label={t("displayName")}
							isOptional={true}
							placeholder="Google"
							value={form?.name || ""}
							onChange={onChange}
							error={errors["name"] ? true : false}
							helperText={errors["name"]}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography component="h2">Notifications</Typography>
						<Typography component="p">
							Select the notifications you want to send out
						</Typography>
					</Box>
					<NotificationsConfig
						notifications={notifications}
						setMonitor={setForm}
						setNotifications={form.notifications}
					/>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography
							component="h2"
							variant="h2"
						>
							{t("ignoreTLSError")}
						</Typography>
						<Typography component="p">{t("ignoreTLSErrorDescription")}</Typography>
					</Box>
					<Stack>
						<FormControlLabel
							sx={{ marginLeft: 0 }}
							control={
								<Switch
									name="ignoreTlsErrors"
									checked={form.ignoreTlsErrors ?? false}
									onChange={onChange}
									sx={{ mr: theme.spacing(2) }}
								/>
							}
							label={t("tlsErrorIgnored")}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography
							component="h2"
							variant="h2"
						>
							{t("distributedUptimeCreateAdvancedSettings")}
						</Typography>
					</Box>
					<Stack gap={theme.spacing(20)}>
						<Select
							name="interval"
							label={t("checkFrequency")}
							value={form?.interval / MS_PER_MINUTE || 1}
							onChange={onChange}
							items={frequencies}
						/>
						{form.type === "http" && (
							<>
								<Select
									name="matchMethod"
									label={t("matchMethod")}
									value={form.matchMethod || "equal"}
									onChange={onChange}
									items={matchMethodOptions}
								/>
								<Stack>
									<TextInput
										type="text"
										name="expectedValue"
										label={t("expectedValue")}
										isOptional={true}
										placeholder={expectedValuePlaceholders[form.matchMethod || "equal"]}
										value={form.expectedValue}
										onChange={onChange}
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
										name="jsonPath"
										type="text"
										label="JSON Path"
										isOptional={true}
										placeholder="data.status"
										value={form.jsonPath}
										onChange={onChange}
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
						type="submit"
						variant="contained"
						color="accent"
						loading={isLoading}
						sx={{ px: theme.spacing(12) }}
					>
						{t("settingsSave")}
					</Button>
				</Stack>
			</Stack>
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
		</Stack>
	);
};

export default Configure;
