// React, Redux, Router
import { useTheme } from "@emotion/react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

// Utility and Network
import { infrastructureMonitorValidation } from "../../../Validation/validation";
import {
	createInfrastructureMonitor,
	updateInfrastructureMonitor,
} from "../../../Features/InfrastructureMonitors/infrastructureMonitorsSlice";
import { useHardwareMonitorsFetch } from "../Details/Hooks/useHardwareMonitorsFetch";
import { capitalizeFirstLetter } from "../../../Utils/stringUtils";
import { useTranslation } from "react-i18next";

// MUI
import { Box, Stack, Typography, Button, ButtonGroup } from "@mui/material";

//Components
import Breadcrumbs from "../../../Components/Breadcrumbs";
import Link from "../../../Components/Link";
import ConfigBox from "../../../Components/ConfigBox";
import TextInput from "../../../Components/Inputs/TextInput";
import { HttpAdornment } from "../../../Components/Inputs/TextInput/Adornments";
import { createToast } from "../../../Utils/toastUtils";
import Checkbox from "../../../Components/Inputs/Checkbox";
import Select from "../../../Components/Inputs/Select";
import { CustomThreshold } from "./Components/CustomThreshold";

const SELECT_VALUES = [
	{ _id: 0.25, name: "15 seconds" },
	{ _id: 0.5, name: "30 seconds" },
	{ _id: 1, name: "1 minute" },
	{ _id: 2, name: "2 minutes" },
	{ _id: 5, name: "5 minutes" },
	{ _id: 10, name: "10 minutes" },
];

const METRICS = ["cpu", "memory", "disk", "temperature"];
const METRIC_PREFIX = "usage_";
const MS_PER_MINUTE = 60000;

const hasAlertError = (errors) => {
	return Object.keys(errors).filter((k) => k.startsWith(METRIC_PREFIX)).length > 0;
};

const getAlertError = (errors) => {
	return Object.keys(errors).find((key) => key.startsWith(METRIC_PREFIX))
		? errors[Object.keys(errors).find((key) => key.startsWith(METRIC_PREFIX))]
		: null;
};

const CreateInfrastructureMonitor = () => {
	const theme = useTheme();
	const { user } = useSelector((state) => state.auth);
	const monitorState = useSelector((state) => state.infrastructureMonitor);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { monitorId } = useParams();
	const { t } = useTranslation();

	// Determine if we are creating or editing
	const isCreate = typeof monitorId === "undefined";

	// Fetch monitor details if editing
	const { monitor, isLoading, networkError } = useHardwareMonitorsFetch({ monitorId });

	// State
	const [errors, setErrors] = useState({});
	const [https, setHttps] = useState(false);
	const [infrastructureMonitor, setInfrastructureMonitor] = useState({
		url: "",
		name: "",
		notifications: [],
		notify_email: false,
		interval: 0.25,
		cpu: false,
		usage_cpu: "",
		memory: false,
		usage_memory: "",
		disk: false,
		usage_disk: "",
		temperature: false,
		usage_temperature: "",
		secret: "",
	});

	// Populate form fields if editing
	useEffect(() => {
		if (isCreate || !monitor) return;

		setInfrastructureMonitor({
			url: monitor.url.replace(/^https?:\/\//, ""),
			name: monitor.name || "",
			notifications: monitor.notifications?.filter((n) => typeof n === "object") || [],
			notify_email: (monitor.notifications?.length ?? 0) > 0,
			interval: monitor.interval / MS_PER_MINUTE,
			cpu: monitor.thresholds?.usage_cpu !== undefined,
			usage_cpu: monitor.thresholds?.usage_cpu ? monitor.thresholds.usage_cpu * 100 : "",

			memory: monitor.thresholds?.usage_memory !== undefined,
			usage_memory: monitor.thresholds?.usage_memory
				? monitor.thresholds.usage_memory * 100
				: "",

			disk: monitor.thresholds?.usage_disk !== undefined,
			usage_disk: monitor.thresholds?.usage_disk
				? monitor.thresholds.usage_disk * 100
				: "",

			temperature: monitor.thresholds?.usage_temperature !== undefined,
			usage_temperature: monitor.thresholds?.usage_temperature
				? monitor.thresholds.usage_temperature * 100
				: "",
			secret: monitor.secret || "",
		});
		setHttps(monitor.url.startsWith("https"));
	}, [isCreate, monitor]);

	// Handlers
	const handleCreateInfrastructureMonitor = async (event) => {
		event.preventDefault();

		const formattedNotifications = infrastructureMonitor.notifications.map((n) =>
			typeof n === "string" ? { type: "email", address: n } : n
		);

		if (infrastructureMonitor.notify_email) {
			formattedNotifications.push({ type: "email", address: user.email });
		}

		// Build the form
		let form = {
			url: `http${https ? "s" : ""}://` + infrastructureMonitor.url,
			name:
				infrastructureMonitor.name === ""
					? infrastructureMonitor.url
					: infrastructureMonitor.name,
			interval: infrastructureMonitor.interval * MS_PER_MINUTE,
			cpu: infrastructureMonitor.cpu,
			...(infrastructureMonitor.cpu
				? { usage_cpu: infrastructureMonitor.usage_cpu }
				: {}),
			memory: infrastructureMonitor.memory,
			...(infrastructureMonitor.memory
				? { usage_memory: infrastructureMonitor.usage_memory }
				: {}),
			disk: infrastructureMonitor.disk,
			...(infrastructureMonitor.disk
				? { usage_disk: infrastructureMonitor.usage_disk }
				: {}),
			temperature: infrastructureMonitor.temperature,
			...(infrastructureMonitor.temperature
				? { usage_temperature: infrastructureMonitor.usage_temperature }
				: {}),
			secret: infrastructureMonitor.secret,
			notifications: formattedNotifications,
		};

		const { error } = infrastructureMonitorValidation.validate(form, {
			abortEarly: false,
		});

		if (error) {
			const newErrors = {};
			error.details.forEach((err) => {
				newErrors[err.path[0]] = err.message;
			});
			setErrors(newErrors);
			createToast({ body: "Please check the form for errors." });
			return;
		}

		// Build the thresholds for the form
		const {
			cpu,
			usage_cpu,
			memory,
			usage_memory,
			disk,
			usage_disk,
			temperature,
			usage_temperature,
			...rest
		} = form;

		const thresholds = {
			...(cpu ? { usage_cpu: usage_cpu / 100 } : {}),
			...(memory ? { usage_memory: usage_memory / 100 } : {}),
			...(disk ? { usage_disk: usage_disk / 100 } : {}),
			...(temperature ? { usage_temperature: usage_temperature / 100 } : {}),
		};

		form = {
			...rest,
			description: form.name,
			teamId: user.teamId,
			userId: user._id,
			type: "hardware",
			notifications: infrastructureMonitor.notifications,
			thresholds,
		};

		// Handle create or update
		const action = isCreate
			? await dispatch(createInfrastructureMonitor({ monitor: form }))
			: await dispatch(updateInfrastructureMonitor({ monitorId, monitor: form }));
		if (action.meta.requestStatus === "fulfilled") {
			createToast({
				body: isCreate
					? t("infrastructureMonitorCreated")
					: t("infrastructureMonitorUpdated"),
			});
			navigate("/infrastructure");
		} else {
			createToast({ body: "Failed to save monitor." });
		}
	};

	const handleChange = (event) => {
		const { value, name } = event.target;
		setInfrastructureMonitor({
			...infrastructureMonitor,
			[name]: value,
		});

		const { error } = infrastructureMonitorValidation.validate(
			{ [name]: value },
			{ abortEarly: false }
		);
		setErrors((prev) => ({
			...prev,
			...(error ? { [name]: error.details[0].message } : { [name]: undefined }),
		}));
	};

	const handleCheckboxChange = (event) => {
		const { name } = event.target;
		const { checked } = event.target;
		setInfrastructureMonitor({
			...infrastructureMonitor,
			[name]: checked,
		});
	};

	const handleNotifications = (event, type) => {
		const { value, checked } = event.target;
		let notifications = [...infrastructureMonitor.notifications];

		if (checked) {
			if (!notifications.some((n) => n.type === type && n.address === value)) {
				notifications.push({ type, address: value });
			}
		} else {
			notifications = notifications.filter(
				(n) => !(n.type === type && n.address === value)
			);
		}

		setInfrastructureMonitor((prev) => ({
			...prev,
			notifications,
			...(type === "email" ? { notify_email: checked } : {}),
		}));
	};

	return (
		<Box className="create-infrastructure-monitor">
			<Breadcrumbs
				list={[
					{ name: "Infrastructure monitors", path: "/infrastructure" },
					...(isCreate
						? [{ name: "Create", path: "/infrastructure/create" }]
						: [
								{ name: "Details", path: `/infrastructure/${monitorId}` },
								{ name: "Configure", path: `/infrastructure/configure/${monitorId}` },
							]),
				]}
			/>
			<Stack
				component="form"
				className="create-infrastructure-monitor-form"
				onSubmit={handleCreateInfrastructureMonitor}
				noValidate
				spellCheck="false"
				gap={theme.spacing(12)}
				mt={theme.spacing(6)}
			>
				<Typography
					component="h1"
					variant="h1"
				>
					<Typography
						component="span"
						fontSize="inherit"
					>
						{t(isCreate ? "infrastructureCreateYour" : "infrastructureEditYour")}{" "}
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
					<Stack gap={theme.spacing(6)}>
						<Typography
							component="h2"
							variant="h2"
						>
							{t("settingsGeneralSettings")}
						</Typography>
						<Typography component="p">
							{t("infrastructureCreateGeneralSettingsDescription")}
						</Typography>
						<Typography component="p">
							{t("infrastructureServerRequirement")}{" "}
							<Link
								level="primary"
								url="https://github.com/bluewave-labs/checkmate-agent"
								label={t("common.monitoringAgentName")}
							/>
						</Typography>
					</Stack>
					<Stack gap={theme.spacing(15)}>
						<TextInput
							type="url"
							id="url"
							name="url"
							startAdornment={<HttpAdornment https={https} />}
							placeholder={"localhost:59232/api/v1/metrics"}
							label={t("infrastructureServerUrlLabel")}
							https={https}
							value={infrastructureMonitor.url}
							onChange={handleChange}
							error={errors["url"] ? true : false}
							helperText={errors["url"]}
							disabled={!isCreate}
						/>
						{isCreate && (
							<Box>
								<Typography component="p">{t("infrastructureProtocol")}</Typography>
								<ButtonGroup>
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
							</Box>
						)}
						<TextInput
							type="text"
							id="name"
							name="name"
							label={t("infrastructureDisplayNameLabel")}
							placeholder="Google"
							isOptional={true}
							value={infrastructureMonitor.name}
							onChange={handleChange}
							error={errors["name"]}
						/>
						<TextInput
							type="text"
							id="secret"
							name="secret"
							label={t("infrastructureAuthorizationSecretLabel")}
							value={infrastructureMonitor.secret}
							onChange={handleChange}
							error={errors["secret"] ? true : false}
							helperText={errors["secret"]}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography
							component="h2"
							variant="h2"
						>
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
							isChecked={infrastructureMonitor.notify_email}
							value={user?.email}
							onChange={(event) => handleNotifications(event, "email")}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography
							component="h2"
							variant="h2"
						>
							{t("infrastructureCustomizeAlerts")}
						</Typography>
						<Typography component="p">
							{t("infrastructureAlertNotificationDescription")}
						</Typography>
					</Box>
					<Stack gap={theme.spacing(6)}>
						{METRICS.map((metric) => {
							return (
								<CustomThreshold
									key={metric}
									infrastructureMonitor={infrastructureMonitor}
									errors={errors}
									checkboxId={metric}
									checkboxName={metric}
									checkboxLabel={
										metric !== "cpu"
											? capitalizeFirstLetter(metric)
											: metric.toUpperCase()
									}
									onCheckboxChange={handleCheckboxChange}
									isChecked={infrastructureMonitor[metric]}
									fieldId={METRIC_PREFIX + metric}
									fieldName={METRIC_PREFIX + metric}
									fieldValue={String(infrastructureMonitor[METRIC_PREFIX + metric])}
									onFieldChange={handleChange}
									alertUnit={metric == "temperature" ? "°C" : "%"}
								/>
							);
						})}
						{/* Error text */}
						{hasAlertError(errors) && (
							<Typography
								component="span"
								className="input-error"
								color={theme.palette.error.main}
								mt={theme.spacing(2)}
								sx={{
									opacity: 0.8,
								}}
							>
								{getAlertError(errors)}
							</Typography>
						)}
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
					<Stack gap={theme.spacing(12)}>
						<Select
							id="interval"
							name="interval"
							label="Check frequency"
							value={infrastructureMonitor.interval || 15}
							onChange={handleChange}
							items={SELECT_VALUES}
						/>
					</Stack>
				</ConfigBox>
				<Stack
					direction="row"
					justifyContent="flex-end"
				>
					<Button
						variant="contained"
						color="accent"
						onClick={handleCreateInfrastructureMonitor}
						loading={monitorState?.isLoading}
					>
						{t(isCreate ? "infrastructureCreateMonitor" : "infrastructureEditMonitor")}
					</Button>
				</Stack>
			</Stack>
		</Box>
	);
};

export default CreateInfrastructureMonitor;
