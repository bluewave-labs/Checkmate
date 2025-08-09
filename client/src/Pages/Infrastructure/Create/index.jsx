//Components
import Breadcrumbs from "../../../Components/Breadcrumbs";
import ConfigBox from "../../../Components/ConfigBox";
import Dialog from "../../../Components/Dialog";
import FieldWrapper from "../../../Components/Inputs/FieldWrapper";
import Link from "../../../Components/Link";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import PulseDot from "../../../Components/Animated/PulseDot";
import Select from "../../../Components/Inputs/Select";
import TextInput from "../../../Components/Inputs/TextInput";
import { Box, Stack, Tooltip, Typography, Button, ButtonGroup } from "@mui/material";
import { CustomThreshold } from "./Components/CustomThreshold";
import { HttpAdornment } from "../../../Components/Inputs/TextInput/Adornments";
import { createToast } from "../../../Utils/toastUtils";
// Utils
import NotificationsConfig from "../../../Components/NotificationConfig";
import { capitalizeFirstLetter } from "../../../Utils/stringUtils";
import { infrastructureMonitorValidation } from "../../../Validation/validation";
import { useGetNotificationsByTeamId } from "../../../Hooks/useNotifications";
import { useMonitorUtils } from "../../../Hooks/useMonitorUtils";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import {
	useCreateMonitor,
	useDeleteMonitor,
	useFetchGlobalSettings,
	useFetchHardwareMonitorById,
	usePauseMonitor,
	useUpdateMonitor,
} from "../../../Hooks/monitorHooks";

const CreateInfrastructureMonitor = () => {
	const { user } = useSelector((state) => state.auth);
	const { monitorId } = useParams();
	const isCreate = typeof monitorId === "undefined";

	const theme = useTheme();
	const { t } = useTranslation();

	// State
	const [errors, setErrors] = useState({});
	const [https, setHttps] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [updateTrigger, setUpdateTrigger] = useState(false);
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

	// Fetch monitor details if editing
	const { statusColor, pagespeedStatusMsg, determineState } = useMonitorUtils();
	const [monitor, isLoading] = useFetchHardwareMonitorById({
		monitorId,
		updateTrigger,
	});
	const [createMonitor, isCreating] = useCreateMonitor();
	const [deleteMonitor, isDeleting] = useDeleteMonitor();
	const [globalSettings, globalSettingsLoading] = useFetchGlobalSettings();
	const [notifications, notificationsAreLoading] = useGetNotificationsByTeamId();
	const [pauseMonitor, isPausing] = usePauseMonitor();
	const [updateMonitor, isUpdating] = useUpdateMonitor();

	const FREQUENCIES = [
		{ _id: 0.25, name: t("time.fifteenSeconds") },
		{ _id: 0.5, name: t("time.thirtySeconds") },
		{ _id: 1, name: t("time.oneMinute") },
		{ _id: 2, name: t("time.twoMinutes") },
		{ _id: 5, name: t("time.fiveMinutes") },
		{ _id: 10, name: t("time.tenMinutes") },
	];
	const CRUMBS = [
		{ name: "Infrastructure monitors", path: "/infrastructure" },
		...(isCreate
			? [{ name: "Create", path: "/infrastructure/create" }]
			: [
					{ name: "Details", path: `/infrastructure/${monitorId}` },
					{ name: "Configure", path: `/infrastructure/configure/${monitorId}` },
				]),
	];
	const METRICS = ["cpu", "memory", "disk", "temperature"];
	const METRIC_PREFIX = "usage_";
	const MS_PER_MINUTE = 60000;

	const hasAlertError = (errors) => {
		return Object.keys(errors).filter((k) => k.startsWith(METRIC_PREFIX)).length > 0;
	};

	const getAlertError = (errors) => {
		const errorKey = Object.keys(errors).find((key) => key.startsWith(METRIC_PREFIX));
		return errorKey ? errors[errorKey] : null;
	};

	const pageSchema = infrastructureMonitorValidation.fork(["url"], (s) =>
		isCreate ? s.required() : s.optional()
	);

	// Populate form fields if editing
	useEffect(() => {
		if (isCreate) {
			if (globalSettingsLoading) return;

			const gt = globalSettings?.data?.settings?.globalThresholds || {};

			setHttps(false);

			setInfrastructureMonitor({
				url: "",
				name: "",
				notifications: [],
				interval: 0.25,
				cpu: gt.cpu !== undefined,
				usage_cpu: gt.cpu !== undefined ? gt.cpu.toString() : "",
				memory: gt.memory !== undefined,
				usage_memory: gt.memory !== undefined ? gt.memory.toString() : "",
				disk: gt.disk !== undefined,
				usage_disk: gt.disk !== undefined ? gt.disk.toString() : "",
				temperature: gt.temperature !== undefined,
				usage_temperature: gt.temperature !== undefined ? gt.temperature.toString() : "",
				secret: "",
			});
		} else if (monitor) {
			const { thresholds = {} } = monitor;

			setHttps(monitor.url.startsWith("https"));

			setInfrastructureMonitor({
				url: monitor.url.replace(/^https?:\/\//, ""),
				name: monitor.name || "",
				notifications: monitor.notifications || [],
				interval: monitor.interval / MS_PER_MINUTE,
				cpu: thresholds.usage_cpu !== undefined,
				usage_cpu:
					thresholds.usage_cpu !== undefined
						? (thresholds.usage_cpu * 100).toString()
						: "",
				memory: thresholds.usage_memory !== undefined,
				usage_memory:
					thresholds.usage_memory !== undefined
						? (thresholds.usage_memory * 100).toString()
						: "",
				disk: thresholds.usage_disk !== undefined,
				usage_disk:
					thresholds.usage_disk !== undefined
						? (thresholds.usage_disk * 100).toString()
						: "",
				temperature: thresholds.usage_temperature !== undefined,
				usage_temperature:
					thresholds.usage_temperature !== undefined
						? (thresholds.usage_temperature * 100).toString()
						: "",
				secret: monitor.secret || "",
			});
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

		const { error } = pageSchema.validate(form, {
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
			url: `http${https ? "s" : ""}://` + infrastructureMonitor.url,
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

	const triggerUpdate = () => {
		setUpdateTrigger(!updateTrigger);
	};

	const onChange = (event) => {
		const { name, value } = event.target;

		setInfrastructureMonitor((prev) => ({ ...prev, [name]: value }));

		if (name === "url") {
			const candidate = value ? `http${https ? "s" : ""}://` + value : value;

			const urlSchema = pageSchema.extract("url");
			const { error } = urlSchema.validate(candidate, { abortEarly: false });

			setErrors((prev) => ({
				...prev,
				url: error ? error.details[0].message : undefined,
			}));
			return;
		}
	};

	const handleCheckboxChange = (event) => {
		const { name } = event.target;
		const { checked } = event.target;
		setInfrastructureMonitor({
			...infrastructureMonitor,
			[name]: checked,
		});
	};

	const handlePause = async () => {
		await pauseMonitor({ monitorId, triggerUpdate });
	};

	const handleRemove = async (event) => {
		event.preventDefault();
		await deleteMonitor({ monitor, redirect: "/infrastructure" });
	};

	const isBusy =
		isLoading ||
		isUpdating ||
		isCreating ||
		isDeleting ||
		isPausing ||
		notificationsAreLoading;

	return (
		<Box className="create-infrastructure-monitor">
			<Breadcrumbs list={CRUMBS} />
			<Stack
				component="form"
				onSubmit={onSubmit}
				noValidate
				spellCheck="false"
				gap={theme.spacing(12)}
				mt={theme.spacing(6)}
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
							<Typography
								component="span"
								fontSize="inherit"
								color={
									!isCreate ? theme.palette.primary.contrastTextSecondary : undefined
								}
							>
								{!isCreate ? infrastructureMonitor.name : t("createYour") + " "}
							</Typography>
							{isCreate ? (
								<Typography
									component="span"
									fontSize="inherit"
									fontWeight="inherit"
									color={theme.palette.primary.contrastTextSecondary}
								>
									{t("monitor")}
								</Typography>
							) : (
								<></>
							)}
						</Typography>
						{!isCreate && (
							<Stack
								direction="row"
								alignItems="center"
								height="fit-content"
								gap={theme.spacing(2)}
							>
								<Tooltip
									title={pagespeedStatusMsg[determineState(monitor)]}
									disableInteractive
									slotProps={{
										popper: {
											modifiers: [
												{
													name: "offset",
													options: { offset: [0, -8] },
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
									variant="monitorUrl"
								>
									{infrastructureMonitor.url?.replace(/^https?:\/\//, "") || "..."}
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
											width: theme.spacing(2),
											height: theme.spacing(2),
											borderRadius: "50%",
											backgroundColor: theme.palette.primary.contrastTextTertiary,
											opacity: 0.8,
											left: theme.spacing(-5),
											top: "50%",
											transform: "translateY(-50%)",
										},
									}}
								>
									{t("editing")}
								</Typography>
							</Stack>
						)}
					</Box>
					{!isCreate && (
						<Box
							alignSelf="flex-end"
							ml="auto"
						>
							<Button
								onClick={handlePause}
								loading={isBusy}
								variant="contained"
								color="secondary"
								sx={{
									pl: theme.spacing(4),
									pr: theme.spacing(6),
									"& svg": {
										mr: theme.spacing(2),
										"& path": {
											stroke: theme.palette.primary.contrastTextTertiary,
											strokeWidth: 0.1,
										},
									},
								}}
							>
								{monitor?.isActive ? (
									<>
										<PauseCircleOutlineIcon />
										{t("pause")}
									</>
								) : (
									<>
										<PlayCircleOutlineRoundedIcon />
										{t("resume")}
									</>
								)}
							</Button>
							<Button
								loading={isBusy}
								variant="contained"
								color="error"
								onClick={() => setIsOpen(true)}
								sx={{ ml: theme.spacing(6) }}
							>
								{t("remove")}
							</Button>
						</Box>
					)}
				</Stack>
				<ConfigBox>
					<Stack>
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
						/>

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
						<Typography
							component="h2"
							variant="h2"
						>
							{t("notificationConfig.title")}
						</Typography>
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
							items={FREQUENCIES}
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
						loading={isBusy}
					>
						{t(isCreate ? "infrastructureCreateMonitor" : "infrastructureEditMonitor")}
					</Button>
				</Stack>
			</Stack>
			{!isCreate && (
				<Dialog
					open={isOpen}
					theme={theme}
					title={t("deleteDialogTitle")}
					description={t("deleteDialogDescription")}
					onCancel={() => setIsOpen(false)}
					confirmationButtonLabel={t("delete")}
					onConfirm={handleRemove}
				/>
			)}
		</Box>
	);
};

export default CreateInfrastructureMonitor;
