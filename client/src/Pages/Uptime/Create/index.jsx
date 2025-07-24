//Components
import {
	Box,
	Button,
	ButtonGroup,
	FormControlLabel,
	Stack,
	Switch,
	Tooltip,
	Typography,
} from "@mui/material";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import TextInput from "../../../Components/Inputs/TextInput";
import { HttpAdornment } from "../../../Components/Inputs/TextInput/Adornments";
import Radio from "../../../Components/Inputs/Radio";
import Select from "../../../Components/Inputs/Select";
import ConfigBox from "../../../Components/ConfigBox";
import NotificationsConfig from "../../../Components/NotificationConfig";
import Checkbox from "../../../Components/Inputs/Checkbox";
import Dialog from "../../../Components/Dialog";
import PulseDot from "../../../Components/Animated/PulseDot";
import SkeletonLayout from "./skeleton";

// Utils
import { useTheme } from "@emotion/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { monitorValidation } from "../../../Validation/validation";
import { createToast } from "../../../Utils/toastUtils";
import {
	PauseOutlined as PauseOutlinedIcon,
	PlayArrowOutlined as PlayArrowOutlinedIcon,
} from "@mui/icons-material";
import { useMonitorUtils } from "../../../Hooks/useMonitorUtils";
import { useGetNotificationsByTeamId } from "../../../Hooks/useNotifications";
import { useParams } from "react-router-dom";
import {
	useCreateMonitor,
	useDeleteMonitor,
	useUpdateMonitor,
	usePauseMonitor,
	useFetchMonitorById,
} from "../../../Hooks/monitorHooks";

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
 * Create page renders monitor creation or configuration views.
 * @component
 */
const UptimeCreate = () => {
	const { monitorId } = useParams();
	const isCreate = typeof monitorId === "undefined";

	// States
	const [monitor, setMonitor] = useState({
		type: "http",
		matchMethod: "equal",
		expectedValue: "",
		jsonPath: "",
		notifications: [],
		interval: 60000,
		ignoreTlsErrors: false,
		...(isCreate ? { url: "", name: "" } : { port: undefined }),
	});
	const [errors, setErrors] = useState({});
	const [https, setHttps] = useState(true);
	const [isOpen, setIsOpen] = useState(false);
	const [useAdvancedMatching, setUseAdvancedMatching] = useState(false);
	const [updateTrigger, setUpdateTrigger] = useState(false);
	const triggerUpdate = () => {
		setUpdateTrigger(!updateTrigger);
	};

	// Hooks
	const [notifications, notificationsAreLoading, notificationsError] =
		useGetNotificationsByTeamId();
	const { determineState, statusColor } = useMonitorUtils();
	// Network
	const [isLoading] = useFetchMonitorById({
		monitorId,
		setMonitor,
		updateTrigger: true,
	});
	const [createMonitor, isCreating] = useCreateMonitor();
	const [pauseMonitor, isPausing] = usePauseMonitor({});
	const [deleteMonitor, isDeleting] = useDeleteMonitor();
	const [updateMonitor, isUpdating] = useUpdateMonitor();

	// Setup
	const theme = useTheme();
	const { t } = useTranslation();

	// Constants
	const MS_PER_MINUTE = 60000;
	const FREQUENCIES = [
		{ _id: 1, name: t("time.oneMinute") },
		{ _id: 2, name: t("time.twoMinutes") },
		{ _id: 3, name: t("time.threeMinutes") },
		{ _id: 4, name: t("time.fourMinutes") },
		{ _id: 5, name: t("time.fiveMinutes") },
	];
	const CRUMBS = [
		{ name: "uptime", path: "/uptime" },
		...(isCreate
			? [{ name: "create", path: `/uptime/create` }]
			: [
					{ name: "details", path: `/uptime/${monitorId}` },
					{ name: "configure", path: `/uptime/configure/${monitorId}` },
				]),
	];
	const matchMethodOptions = [
		{ _id: "equal", name: t("matchMethodOptions.equal") },
		{ _id: "include", name: t("matchMethodOptions.include") },
		{ _id: "regex", name: t("matchMethodOptions.regex") },
	];
	const expectedValuePlaceholders = {
		regex: t("matchMethodOptions.regexPlaceholder"),
		equal: t("matchMethodOptions.equalPlaceholder"),
		include: t("matchMethodOptions.includePlaceholder"),
	};
	const monitorTypeMaps = {
		http: {
			label: t("monitorType.http.label"),
			placeholder: t("monitorType.http.placeholder"),
			namePlaceholder: t("monitorType.http.namePlaceholder"),
		},
		ping: {
			label: t("monitorType.ping.label"),
			placeholder: t("monitorType.ping.placeholder"),
			namePlaceholder: t("monitorType.ping.namePlaceholder"),
		},
		docker: {
			label: t("monitorType.docker.label"),
			placeholder: t("monitorType.docker.placeholder"),
			namePlaceholder: t("monitorType.docker.namePlaceholder"),
		},
		port: {
			label: t("monitorType.port.label"),
			placeholder: t("monitorType.port.placeholder"),
			namePlaceholder: t("monitorType.port.namePlaceholder"),
		},
	};

	// Handlers
	const onSubmit = async (event) => {
		event.preventDefault();
		const { notifications, ...rest } = monitor;

		let form = {};
		if (isCreate) {
			form = {
				...rest,
				url:
					monitor.type === "http"
						? `http${https ? "s" : ""}://` + monitor.url
						: monitor.url,
				port: monitor.type === "port" ? monitor.port : undefined,
				name: monitor.name || monitor.url.substring(0, 50),
				type: monitor.type,
				interval: monitor.interval,
			};
		} else {
			form = {
				_id: monitor._id,
				url: monitor.url,
				name: monitor.name || monitor.url.substring(0, 50),
				type: monitor.type,
				matchMethod: monitor.matchMethod,
				expectedValue: monitor.expectedValue,
				jsonPath: monitor.jsonPath,
				interval: monitor.interval,
				teamId: monitor.teamId,
				userId: monitor.userId,
				port: monitor.type === "port" ? monitor.port : undefined,
				ignoreTlsErrors: monitor.ignoreTlsErrors,
			};
		}
		if (!useAdvancedMatching) {
			form.matchMethod = isCreate ? undefined : "";
			form.expectedValue = isCreate ? undefined : "";
			form.jsonPath = isCreate ? undefined : "";
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
			createToast({ body: t("checkFormError") });
			return;
		}

		form = {
			...form,
			description: monitor.name || monitor.url,
			notifications: monitor.notifications,
		};

		if (isCreate) {
			await createMonitor({ monitor: form, redirect: "/uptime" });
		} else {
			await updateMonitor({ monitor: form, redirect: "/uptime" });
		}
	};

	const onChange = (event) => {
		let { name, value, checked } = event.target;

		if (name === "ignoreTlsErrors") {
			value = checked;
		}

		if (name === "useAdvancedMatching") {
			setUseAdvancedMatching(checked);
			return;
		}

		if (name === "interval") {
			value = value * MS_PER_MINUTE;
		}

		setMonitor((prev) => ({ ...prev, [name]: value }));

		const { error } = monitorValidation.validate(
			{ type: monitor.type, [name]: value },
			{ abortEarly: false }
		);

		setErrors((prev) => ({
			...prev,
			...(error ? { [name]: error.details[0].message } : { [name]: undefined }),
		}));
	};

	const handlePause = async () => {
		await pauseMonitor({ monitorId, triggerUpdate });
	};

	const handleRemove = async (event) => {
		event.preventDefault();
		await deleteMonitor({ monitor, redirect: "/uptime" });
	};

	const isBusy = isLoading || isCreating || isDeleting || isUpdating || isPausing;
	const displayInterval = monitor?.interval / MS_PER_MINUTE || 1;
	const parsedUrl = parseUrl(monitor?.url);
	const protocol = parsedUrl?.protocol?.replace(":", "") || "";

	useEffect(() => {
		if (!isCreate) {
			if (monitor.matchMethod) {
				setUseAdvancedMatching(true);
			} else {
				setUseAdvancedMatching(false);
			}
		}
	}, [monitor, isCreate]);

	if (Object.keys(monitor).length === 0) {
		return <SkeletonLayout />;
	}

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={CRUMBS} />

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
							variant="h1"
						>
							<Typography
								component="span"
								fontSize="inherit"
								color={
									!isCreate ? theme.palette.primary.contrastTextSecondary : undefined
								}
							>
								{!isCreate ? monitor.name : t("createYour") + " "}
							</Typography>
							{isCreate && (
								<Typography
									component="span"
									fontSize="inherit"
									fontWeight="inherit"
									color={theme.palette.primary.contrastTextSecondary}
								>
									{t("monitor")}
								</Typography>
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
									variant="monitorUrl"
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
								loading={isBusy}
								startIcon={
									monitor?.isActive ? <PauseOutlinedIcon /> : <PlayArrowOutlinedIcon />
								}
								onClick={handlePause}
							>
								{monitor?.isActive ? t("pause") : t("resume")}
							</Button>
							<Button
								loading={isBusy}
								variant="contained"
								color="error"
								sx={{ px: theme.spacing(8) }}
								onClick={() => setIsOpen(true)}
							>
								{t("remove")}
							</Button>
						</Box>
					)}
				</Stack>
				{isCreate && (
					<ConfigBox>
						<Box>
							<Typography
								component="h2"
								variant="h2"
							>
								{t("distributedUptimeCreateChecks")}
							</Typography>
							<Typography component="p">
								{t("distributedUptimeCreateChecksDescription")}
							</Typography>
						</Box>
						<Stack gap={theme.spacing(12)}>
							<Stack gap={theme.spacing(6)}>
								<Radio
									name="type"
									title={t("websiteMonitoring")}
									desc={t("websiteMonitoringDescription")}
									size="small"
									value="http"
									checked={monitor.type === "http"}
									onChange={onChange}
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
								name="type"
								title={t("pingMonitoring")}
								desc={t("pingMonitoringDescription")}
								size="small"
								value="ping"
								checked={monitor.type === "ping"}
								onChange={onChange}
							/>
							<Radio
								name="type"
								title={t("dockerContainerMonitoring")}
								desc={t("dockerContainerMonitoringDescription")}
								size="small"
								value="docker"
								checked={monitor.type === "docker"}
								onChange={onChange}
							/>
							<Radio
								name="type"
								title={t("portMonitoring")}
								desc={t("portMonitoringDescription")}
								size="small"
								value="port"
								checked={monitor.type === "port"}
								onChange={onChange}
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
				)}
				<ConfigBox>
					<Box>
						<Typography
							component="h2"
							variant="h2"
						>
							{t("settingsGeneralSettings")}
						</Typography>
						<Typography component="p">
							{isCreate
								? t(`uptimeGeneralInstructions.${monitor.type}`)
								: t("distributedUptimeCreateSelectURL")}
						</Typography>
					</Box>
					<Stack gap={theme.spacing(20)}>
						<TextInput
							id="monitor-url"
							name="url"
							type={monitor?.type === "http" ? "url" : "text"}
							label={
								(monitor.type === "http" || monitor.type === "port") && !isCreate
									? t("url")
									: monitorTypeMaps[monitor.type].label || t("urlMonitor")
							}
							placeholder={monitorTypeMaps[monitor.type].placeholder || ""}
							value={parsedUrl?.host + parsedUrl?.pathname || monitor?.url || ""}
							https={isCreate ? https : protocol === "https"}
							startAdornment={
								monitor?.type === "http" && (
									<HttpAdornment https={isCreate ? https : protocol === "https"} />
								)
							}
							helperText={errors["url"]}
							onChange={onChange}
							disabled={!isCreate}
						/>
						<TextInput
							name="port"
							type="number"
							label={t("portToMonitor")}
							placeholder="5173"
							value={monitor.port || ""}
							onChange={onChange}
							error={errors["port"] ? true : false}
							helperText={errors["port"]}
							hidden={monitor.type !== "port"}
						/>
						<TextInput
							name="name"
							type="text"
							label={t("displayName")}
							isOptional={true}
							placeholder={monitorTypeMaps[monitor.type].namePlaceholder}
							value={monitor.name || ""}
							onChange={onChange}
							error={errors["name"] ? true : false}
							helperText={errors["name"]}
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
						setMonitor={setMonitor}
						setNotifications={isCreate ? null : monitor.notifications}
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
							sx={{ marginLeft: theme.spacing(0) }}
							control={
								<Switch
									name="ignoreTlsErrors"
									checked={monitor.ignoreTlsErrors}
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
							value={displayInterval}
							onChange={onChange}
							items={FREQUENCIES}
						/>
						{monitor.type === "http" && (
							<Checkbox
								name="useAdvancedMatching"
								label={t("advancedMatching")}
								isChecked={useAdvancedMatching}
								onChange={onChange}
							/>
						)}
						{monitor.type === "http" && useAdvancedMatching && (
							<>
								<Select
									name="matchMethod"
									label={t("matchMethod")}
									value={monitor.matchMethod || "equal"}
									onChange={onChange}
									items={matchMethodOptions}
								/>
								<Stack>
									<TextInput
										type="text"
										name="expectedValue"
										label={t("expectedValue")}
										isOptional={true}
										placeholder={
											expectedValuePlaceholders[monitor.matchMethod || "equal"]
										}
										value={monitor.expectedValue}
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
										label={t("uptimeAdvancedMatching.jsonPath")}
										isOptional={true}
										placeholder="data.status"
										value={monitor.jsonPath}
										onChange={onChange}
										error={errors["jsonPath"] ? true : false}
										helperText={errors["jsonPath"]}
									/>
									<Typography
										component="span"
										color={theme.palette.primary.contrastTextTertiary}
										opacity={0.8}
									>
										{t("uptimeCreateJsonPath") + " "}
										<Typography
											component="a"
											href="https://jmespath.org/"
											target="_blank"
											color="info"
										>
											jmespath.org
										</Typography>
										{" " + t("uptimeCreateJsonPathQuery")}
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
						type="submit"
						variant="contained"
						color="accent"
						disabled={!Object.values(errors).every((value) => value === undefined)}
						loading={isBusy}
						sx={{ px: theme.spacing(12) }}
					>
						{t("settingsSave")}
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
					isLoading={isLoading}
				/>
			)}
		</Stack>
	);
};

export default UptimeCreate;
