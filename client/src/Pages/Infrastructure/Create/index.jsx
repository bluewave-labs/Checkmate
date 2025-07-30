// React, Redux, Router
import { useTheme } from "@emotion/react";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
// Utility and Network
import { infrastructureMonitorValidation } from "../../../Validation/validation";
import { useFetchHardwareMonitorById } from "../../../Hooks/monitorHooks";
import { capitalizeFirstLetter } from "../../../Utils/stringUtils";
import { useTranslation } from "react-i18next";
import { useGetNotificationsByTeamId } from "../../../Hooks/useNotifications";
import NotificationsConfig from "../../../Components/NotificationConfig";
import {
	useUpdateMonitor,
	useCreateMonitor,
	useFetchGlobalSettings,
} from "../../../Hooks/monitorHooks";

// MUI
import { Box, Stack, Typography, Button, ButtonGroup } from "@mui/material";

//Components
import Breadcrumbs from "../../../Components/Breadcrumbs";
import Link from "../../../Components/Link";
import ConfigBox from "../../../Components/ConfigBox";
import TextInput from "../../../Components/Inputs/TextInput";
import { HttpAdornment } from "../../../Components/Inputs/TextInput/Adornments";
import { createToast } from "../../../Utils/toastUtils";
import Select from "../../../Components/Inputs/Select";
import { CustomThreshold } from "./Components/CustomThreshold";
import FieldWrapper from "../../../Components/Inputs/FieldWrapper";

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
	const { monitorId } = useParams();
	const { t } = useTranslation();

	// Determine if we are creating or editing
	const isCreate = typeof monitorId === "undefined";

	// Fetch monitor details if editing
	const [monitor, isLoading, networkError] = useFetchHardwareMonitorById({ monitorId });
	const [notifications, notificationsAreLoading, notificationsError] =
		useGetNotificationsByTeamId();
	const [updateMonitor, isUpdating] = useUpdateMonitor();
	const [createMonitor, isCreating] = useCreateMonitor();
	const [globalSettings, globalSettingsLoading] = useFetchGlobalSettings();

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
		if (isCreate) {
			// If global settings are not loaded yet, use default thresholds
			if (globalSettingsLoading) return;

			// Create mode: use global thresholds
			const globalThresholds = globalSettings?.data?.settings?.globalThresholds || {};
			const defaultThresholds = {
				cpu: "",
				memory: "",
				disk: "",
				temperature: "",
			};

			setInfrastructureMonitor((prev) => ({
				...prev,
				url: "",
				name: "",
				notifications: [],
				interval: 0.25,
				cpu: globalThresholds.cpu != null,
				usage_cpu:
					globalThresholds.cpu != null
						? globalThresholds.cpu.toString()
						: defaultThresholds.cpu,
				memory: globalThresholds.memory != null,
				usage_memory:
					globalThresholds.memory != null
						? globalThresholds.memory.toString()
						: defaultThresholds.memory,
				disk: globalThresholds.disk != null,
				usage_disk:
					globalThresholds.disk != null
						? globalThresholds.disk.toString()
						: defaultThresholds.disk,
				temperature: globalThresholds.temperature != null,
				usage_temperature:
					globalThresholds.temperature != null
						? globalThresholds.temperature.toString()
						: defaultThresholds.temperature,
			}));
		} else if (monitor) {
			// Edit mode: use monitor only, ignore global thresholds
			setInfrastructureMonitor((prev) => ({
				...prev,
				url: monitor.url?.replace(/^https?:\/\//, "") || "",
				name: monitor.name || "",
				notifications: monitor.notifications || [],
				interval: monitor.interval / MS_PER_MINUTE,
				cpu: monitor.thresholds?.usage_cpu != null,
				usage_cpu:
					monitor.thresholds?.usage_cpu != null
						? (monitor.thresholds.usage_cpu * 100).toString()
						: "",
				memory: monitor.thresholds?.usage_memory != null,
				usage_memory:
					monitor.thresholds?.usage_memory != null
						? (monitor.thresholds.usage_memory * 100).toString()
						: "",
				disk: monitor.thresholds?.usage_disk != null,
				usage_disk:
					monitor.thresholds?.usage_disk != null
						? (monitor.thresholds.usage_disk * 100).toString()
						: "",
				temperature: monitor.thresholds?.usage_temperature != null,
				usage_temperature:
					monitor.thresholds?.usage_temperature != null
						? (monitor.thresholds.usage_temperature * 100).toString()
						: "",
				secret: monitor.secret || "",
			}));

			setHttps(monitor.url?.startsWith("https"));
		}
	}, [isCreate, monitor, globalSettings, globalSettingsLoading]);

	// Handlers
	const onSubmit = async (event) => {
		event.preventDefault();

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
		};

		const { error } = infrastructureMonitorValidation.validate(form, {
			abortEarly: false,
		});

		if (error) {
			const newErrors = {};
			error.details.forEach((err) => {
				newErrors[err.path[0]] = err.message;
			});
			console.log(newErrors);
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
			...(isCreate ? {} : { _id: monitorId }),
			...rest,
			description: form.name,
			type: "hardware",
			notifications: infrastructureMonitor.notifications,
			thresholds,
		};

		// Handle create or update
		isCreate
			? await createMonitor({ monitor: form, redirect: "/infrastructure" })
			: await updateMonitor({ monitor: form, redirect: "/infrastructure" });
	};

	const onChange = (event) => {
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
				onSubmit={onSubmit}
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
					<Stack gap={theme.spacing(8)}>
						<TextInput
							type="url"
							id="url"
							name="url"
							startAdornment={<HttpAdornment https={https} />}
							placeholder={"localhost:59232/api/v1/metrics"}
							label={t("infrastructureServerUrlLabel")}
							https={https}
							value={infrastructureMonitor.url}
							onChange={onChange}
							error={errors["url"] ? true : false}
							helperText={errors["url"]}
							disabled={!isCreate}
						/>
						{isCreate && (
							<FieldWrapper
								label={t("infrastructureProtocol")}
								labelVariant="p"
							>
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
							</FieldWrapper>
						)}
						<TextInput
							type="text"
							id="name"
							name="name"
							label={t("infrastructureDisplayNameLabel")}
							placeholder="Google"
							isOptional={true}
							value={infrastructureMonitor.name}
							onChange={onChange}
							error={errors["name"]}
						/>
						<TextInput
							type="text"
							id="secret"
							name="secret"
							label={t("infrastructureAuthorizationSecretLabel")}
							value={infrastructureMonitor.secret}
							onChange={onChange}
							error={errors["secret"] ? true : false}
							helperText={errors["secret"]}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography component="h2">{t("notificationConfig.title")}</Typography>
						<Typography component="p">{t("notificationConfig.description")}</Typography>
					</Box>
					<NotificationsConfig
						notifications={notifications}
						setMonitor={setInfrastructureMonitor}
						setNotifications={infrastructureMonitor.notifications}
					/>
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
									onFieldChange={onChange}
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
							onChange={onChange}
							items={SELECT_VALUES}
						/>
					</Stack>
				</ConfigBox>
				<Stack
					direction="row"
					justifyContent="flex-end"
				>
					<Button
						type="submit"
						variant="contained"
						color="accent"
						loading={isLoading || isUpdating || isCreating || notificationsAreLoading}
					>
						{t(isCreate ? "infrastructureCreateMonitor" : "infrastructureEditMonitor")}
					</Button>
				</Stack>
			</Stack>
		</Box>
	);
};

export default CreateInfrastructureMonitor;
