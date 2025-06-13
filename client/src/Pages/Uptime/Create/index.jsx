//Components
import Breadcrumbs from "../../../Components/Breadcrumbs";
import TextInput from "../../../Components/Inputs/TextInput";
import { HttpAdornment } from "../../../Components/Inputs/TextInput/Adornments";
import Radio from "../../../Components/Inputs/Radio";
import Select from "../../../Components/Inputs/Select";
import ConfigBox from "../../../Components/ConfigBox";
import NotificationsConfig from "../../../Components/NotificationConfig";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "../../../Components/Inputs/Checkbox";

// Utils
import { useTheme } from "@emotion/react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { monitorValidation } from "../../../Validation/validation";
import { createToast } from "../../../Utils/toastUtils";
import { useGetNotificationsByTeamId } from "../../../Hooks/useNotifications";
import { useCreateMonitor } from "../../../Hooks/monitorHooks";

const CreateMonitor = () => {
	// Redux state
	const { user } = useSelector((state) => state.auth);

	// Local state
	const [errors, setErrors] = useState({});
	const [https, setHttps] = useState(true);
	const [useAdvancedMatching, setUseAdvancedMatching] = useState(false);
	const [monitor, setMonitor] = useState({
		url: "",
		name: "",
		type: "http",
		matchMethod: "equal",
		expectedValue: "",
		jsonPath: "",
		notifications: [],
		interval: 1,
		ignoreTlsErrors: false,
	});

	// Setup
	const theme = useTheme();
	const { t } = useTranslation();
	const [notifications, notificationsAreLoading, error] = useGetNotificationsByTeamId();
	const [createMonitor, isCreating] = useCreateMonitor();

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

	const BREADCRUMBS = [
		{ name: "uptime", path: "/uptime" },
		{ name: "create", path: `/uptime/create` },
	];

	// Handlers

	const onSubmit = async (event) => {
		event.preventDefault();
		const { notifications, ...rest } = monitor;

		let form = {
			...rest,
			url:
				//prepending protocol for url
				monitor.type === "http"
					? `http${https ? "s" : ""}://` + monitor.url
					: monitor.url,
			port: monitor.type === "port" ? monitor.port : undefined,
			name: monitor.name || monitor.url.substring(0, 50),
			type: monitor.type,
			interval: monitor.interval * MS_PER_MINUTE,
		};

		// If not using advanced matching, remove advanced settings
		if (!useAdvancedMatching) {
			form.matchMethod = undefined;
			form.expectedValue = undefined;
			form.jsonPath = undefined;
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
			createToast({ body: "Please check the form for errors." });
			return;
		}

		form = {
			...form,
			description: monitor.name || monitor.url,
			teamId: user.teamId,
			userId: user._id,
			notifications: monitor.notifications,
		};

		console.log(JSON.stringify(form, null, 2));
		// await createMonitor({ monitor: form, redirect: "/uptime" });
	};

	const onChange = (event) => {
		const { name, value, checked } = event.target;
		let newValue = value;
		if (name === "ignoreTlsErrors") {
			newValue = checked;
		}

		if (name === "useAdvancedMatching") {
			setUseAdvancedMatching(checked);
			return;
		}

		const updatedMonitor = {
			...monitor,
			[name]: newValue,
		};

		setMonitor(updatedMonitor);

		const { error } = monitorValidation.validate(
			{ type: monitor.type, [name]: newValue },
			{ abortEarly: false }
		);

		setErrors((prev) => ({
			...prev,
			...(error ? { [name]: error.details[0].message } : { [name]: undefined }),
		}));
	};

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />

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
			<Stack
				component="form"
				noValidate
				gap={theme.spacing(12)}
				mt={theme.spacing(6)}
				onSubmit={onSubmit}
			>
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
				<ConfigBox>
					<Box>
						<Typography
							component="h2"
							variant="h2"
						>
							{t("settingsGeneralSettings")}
						</Typography>
						<Typography component="p">
							{t(`uptimeGeneralInstructions.${monitor.type}`)}
						</Typography>
					</Box>
					<Stack gap={theme.spacing(15)}>
						<TextInput
							name="url"
							type={monitor.type === "http" ? "url" : "text"}
							startAdornment={
								monitor.type === "http" ? <HttpAdornment https={https} /> : null
							}
							label={monitorTypeMaps[monitor.type].label || "URL to monitor"}
							https={https}
							placeholder={monitorTypeMaps[monitor.type].placeholder || ""}
							value={monitor.url}
							onChange={onChange}
							error={errors["url"] ? true : false}
							helperText={errors["url"]}
						/>
						<TextInput
							name="port"
							type="number"
							label={t("portToMonitor")}
							placeholder="5173"
							value={monitor.port}
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
							placeholder={monitorTypeMaps[monitor.type].namePlaceholder || ""}
							value={monitor.name}
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
					<Stack gap={theme.spacing(12)}>
						<Select
							name="interval"
							label="Check frequency"
							value={monitor.interval || 1}
							onChange={onChange}
							items={SELECT_VALUES}
						/>
						<Checkbox
							name="useAdvancedMatching"
							label={t("advancedMatching")}
							isChecked={useAdvancedMatching}
							onChange={onChange}
						/>
						{monitor.type === "http" && useAdvancedMatching && (
							<>
								<Select
									name="matchMethod"
									label="Match Method"
									value={monitor.matchMethod || "equal"}
									onChange={onChange}
									items={matchMethodOptions}
								/>
								<Stack>
									<TextInput
										name="expectedValue"
										type="text"
										label="Expected value"
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
										label="JSON Path"
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
						type="submit"
						variant="contained"
						color="accent"
						disabled={!Object.values(errors).every((value) => value === undefined)}
						loading={isCreating}
					>
						{t("createMonitor")}
					</Button>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default CreateMonitor;
