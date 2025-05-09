// React, Redux, Router
import { useTheme } from "@emotion/react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

// Utility and Network
import { checkEndpointResolution } from "../../../Features/UptimeMonitors/uptimeMonitorsSlice";
import { monitorValidation } from "../../../Validation/validation";
import { getUptimeMonitorById } from "../../../Features/UptimeMonitors/uptimeMonitorsSlice";
import { createUptimeMonitor } from "../../../Features/UptimeMonitors/uptimeMonitorsSlice";
// MUI
import { Box, Stack, Typography, Button, ButtonGroup } from "@mui/material";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";

//Components
import Breadcrumbs from "../../../Components/Breadcrumbs";
import TextInput from "../../../Components/Inputs/TextInput";
import { HttpAdornment } from "../../../Components/Inputs/TextInput/Adornments";
import { createToast } from "../../../Utils/toastUtils";
import Radio from "../../../Components/Inputs/Radio";
import Checkbox from "../../../Components/Inputs/Checkbox";
import Select from "../../../Components/Inputs/Select";
import ConfigBox from "../../../Components/ConfigBox";
import NotificationIntegrationModal from "../../../Components/NotificationIntegrationModal/Components/NotificationIntegrationModal";
const CreateMonitor = () => {
	const MS_PER_MINUTE = 60000;
	const SELECT_VALUES = [
		{ _id: 1, name: "1 minute" },
		{ _id: 2, name: "2 minutes" },
		{ _id: 3, name: "3 minutes" },
		{ _id: 4, name: "4 minutes" },
		{ _id: 5, name: "5 minutes" },
	];

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

	const monitorTypeMaps = {
		http: {
			label: "URL to monitor",
			placeholder: "google.com",
			namePlaceholder: "Google",
		},
		ping: {
			label: "IP address to monitor",
			placeholder: "1.1.1.1",
			namePlaceholder: "Google",
		},
		docker: {
			label: "Container ID",
			placeholder: "abc123",
			namePlaceholder: "My Container",
		},
		port: {
			label: "URL to monitor",
			placeholder: "localhost",
			namePlaceholder: "Localhost:5173",
		},
	};

	const { user } = useSelector((state) => state.auth);
	const { isLoading } = useSelector((state) => state.uptimeMonitors);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const theme = useTheme();
	const { monitorId } = useParams();
	const crumbs = [
		{ name: "uptime", path: "/uptime" },
		{ name: "create", path: `/uptime/create` },
	];

	// State
	const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

	const handleOpenNotificationModal = () => {
		setIsNotificationModalOpen(true);
	};
	const [errors, setErrors] = useState({});
	const [https, setHttps] = useState(true);
	const [monitor, setMonitor] = useState({
		url: "",
		name: "",
		type: "http",
		ignoreTlsErrors: false,
		notifications: [],
		interval: 1,
	});

	const handleCreateMonitor = async (event) => {
		event.preventDefault();
		let form = {
			url:
				//prepending protocol for url
				monitor.type === "http"
					? `http${https ? "s" : ""}://` + monitor.url
					: monitor.url,
			port: monitor.type === "port" ? monitor.port : undefined,
			name: monitor.name || monitor.url.substring(0, 50),
			type: monitor.type,
			ignoreTlsErrors: monitor.ignoreTlsErrors,
			interval: monitor.interval * MS_PER_MINUTE,
		};

		if (monitor.type === "http") {
			form.expectedValue = monitor.expectedValue;
			form.jsonPath = monitor.jsonPath;
			form.matchMethod = monitor.matchMethod;
		}

		const { error } = monitorValidation.validate(form, {
			abortEarly: false,
		});

		if (error) {
			const newErrors = {};
			error.details.forEach((err) => {
				newErrors[err.path[0]] = err.message;
			});
			setErrors(newErrors);
			createToast({ body: t("pleaseCheckFormErrors") });
			return;
		}

		form = {
			...form,
			description: monitor.name || monitor.url,
			teamId: user.teamId,
			userId: user._id,
			notifications: monitor.notifications,
		};
		const action = await dispatch(createUptimeMonitor({ monitor: form }));
		if (action.meta.requestStatus === "fulfilled") {
			createToast({ body: t("monitorCreatedSuccessfully") });
			navigate("/uptime");
		} else {
			createToast({ body: t("failedToCreateMonitor") });
		}
	};

	const handleChange = (event, formName) => {
		const { type, checked, value } = event.target;

		const newVal = type === "checkbox" ? checked : value;

		const newMonitor = {
			...monitor,
			[formName]: newVal,
		};
		if (formName === "type") {
			newMonitor.url = "";
		}
		setMonitor(newMonitor);

		const { error } = monitorValidation.validate(
			{ type: monitor.type, [formName]: newVal },
			{ abortEarly: false }
		);
		setErrors((prev) => ({
			...prev,
			url: undefined,
			...(error ? { [formName]: error.details[0].message } : { [formName]: undefined }),
		}));
	};

	const handleNotifications = (event, type) => {
		const { value } = event.target;
		let notifications = [...monitor.notifications];
		const notificationExists = notifications.some((notification) => {
			if (notification.type === type && notification.address === value) {
				return true;
			}
			return false;
		});
		if (notificationExists) {
			notifications = notifications.filter((notification) => {
				if (notification.type === type && notification.address === value) {
					return false;
				}
				return true;
			});
		} else {
			notifications.push({ type, address: value });
		}

		setMonitor((prev) => ({
			...prev,
			notifications,
		}));
	};

	useEffect(() => {
		const fetchMonitor = async () => {
			if (monitorId) {
				const action = await dispatch(getUptimeMonitorById({ monitorId }));

				if (action.payload.success) {
					const data = action.payload.data;
					const { name, ...rest } = data; //data.name is read-only
					if (rest.type === "http") {
						const url = new URL(rest.url);
						rest.url = url.host;
					}
					rest.name = `${name} (Clone)`;
					rest.interval /= MS_PER_MINUTE;
					setMonitor({
						...rest,
					});
				} else {
					navigate("/not-found", { replace: true });
					createToast({
						body: "There was an error cloning the monitor.",
					});
				}
			}
		};
		fetchMonitor();
	}, [monitorId, dispatch, navigate]);

	const { t } = useTranslation();

	return (
		<Box className="create-monitor">
			<Breadcrumbs list={crumbs} />
			<Stack
				component="form"
				gap={theme.spacing(12)}
				mt={theme.spacing(6)}
				onSubmit={handleCreateMonitor}
			>
				<Typography
					component="h1"
					variant="h1"
				>
					<Typography
						component="span"
						fontSize="inherit"
					>
						{t("createYour")}{" "}
					</Typography>
					<Typography
						component="span"
						variant="h2"
						fontSize="inherit"
						fontWeight="inherit"
					>
						{t("monitor")}
					</Typography>
				</Typography>
				<ConfigBox>
					<Box>
						<Typography component="h2">{t("distributedUptimeCreateChecks")}</Typography>
						<Typography component="p">
							{t("distributedUptimeCreateChecksDescription")}
						</Typography>
					</Box>
					<Stack gap={theme.spacing(12)}>
						<Stack gap={theme.spacing(6)}>
							<Radio
								id="monitor-checks-http"
								title={t("websiteMonitoring")}
								desc={t("websiteMonitoringDescription")}
								size="small"
								value="http"
								checked={monitor.type === "http"}
								onChange={(event) => handleChange(event, "type")}
							/>
							{monitor.type === "http" ? (
								<ButtonGroup sx={{ ml: theme.spacing(16) }}>
									<Button
										variant="group"
										filled={https.toString()}
										onClick={() => setHttps(true)}
									>
										{t("https")}
									</Button>
									<Button
										variant="group"
										filled={(!https).toString()}
										onClick={() => setHttps(false)}
									>
										{t("http")}
									</Button>
								</ButtonGroup>
							) : (
								""
							)}
						</Stack>
						<Radio
							id="monitor-checks-ping"
							title={t("pingMonitoring")}
							desc={t("pingMonitoringDescription")}
							size="small"
							value="ping"
							checked={monitor.type === "ping"}
							onChange={(event) => handleChange(event, "type")}
						/>
						<Radio
							id="monitor-checks-docker"
							title={t("dockerContainerMonitoring")}
							desc={t("dockerContainerMonitoringDescription")}
							size="small"
							value="docker"
							checked={monitor.type === "docker"}
							onChange={(event) => handleChange(event, "type")}
						/>
						<Radio
							id="monitor-checks-port"
							title={t("portMonitoring")}
							desc={t("portMonitoringDescription")}
							size="small"
							value="port"
							checked={monitor.type === "port"}
							onChange={(event) => handleChange(event, "type")}
						/>
						{errors["type"] ? (
							<Box className="error-container">
								<Typography
									component="p"
									className="input-error"
									color={theme.palette.error.contrastText}
								>
									{errors["type"]}
								</Typography>
							</Box>
						) : (
							""
						)}
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography component="h2">{t("settingsGeneralSettings")}</Typography>
						<Typography component="p">{t("uptimeCreateSelectURL")}</Typography>
					</Box>
					<Stack gap={theme.spacing(15)}>
						<TextInput
							type={monitor.type === "http" ? "url" : "text"}
							id="monitor-url"
							startAdornment={
								monitor.type === "http" ? <HttpAdornment https={https} /> : null
							}
							label={monitorTypeMaps[monitor.type].label || "URL to monitor"}
							https={https}
							placeholder={monitorTypeMaps[monitor.type].placeholder || ""}
							value={monitor.url}
							onChange={(event) => handleChange(event, "url")}
							error={errors["url"] ? true : false}
							helperText={errors["url"]}
						/>
						<TextInput
							type="number"
							id="monitor-port"
							label={t("portToMonitor")}
							placeholder="5173"
							value={monitor.port}
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
							placeholder={monitorTypeMaps[monitor.type].namePlaceholder || ""}
							value={monitor.name}
							onChange={(event) => handleChange(event, "name")}
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
						<Checkbox
							id="notify-email-default"
							label={`Notify via email (to ${user.email})`}
							isChecked={monitor.notifications.some(
								(notification) => notification.type === "email"
							)}
							value={user?.email}
							onChange={(event) => handleNotifications(event, "email")}
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
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography component="h2">{t("ignoreTLSError")}</Typography>
						<Typography component="p">{t("ignoreTLSErrorDescription")}</Typography>
					</Box>
					<Stack>
						<FormControlLabel
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
					<Stack gap={theme.spacing(12)}>
						<Select
							id="monitor-interval"
							label="Check frequency"
							value={monitor.interval || 1}
							onChange={(event) => handleChange(event, "interval")}
							items={SELECT_VALUES}
						/>
						{monitor.type === "http" && (
							<>
								<Select
									id="match-method"
									label="Match Method"
									value={monitor.matchMethod || "equal"}
									onChange={(event) => handleChange(event, "matchMethod")}
									items={matchMethodOptions}
								/>
								<Stack>
									<TextInput
										type="text"
										id="expected-value"
										label="Expected value"
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
				>
					<Button
						variant="contained"
						color="accent"
						onClick={handleCreateMonitor}
						disabled={!Object.values(errors).every((value) => value === undefined)}
						loading={isLoading}
					>
						{t("createMonitor")}
					</Button>
				</Stack>
			</Stack>

			<NotificationIntegrationModal
				open={isNotificationModalOpen}
				onClose={() => setIsNotificationModalOpen(false)}
				monitor={monitor}
				setMonitor={setMonitor}
			/>
		</Box>
	);
};

export default CreateMonitor;
