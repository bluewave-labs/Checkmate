// React, Redux, Router
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

// Utility and Network
import { infrastructureMonitorValidation } from "../../../Validation/validation";
import { createInfrastructureMonitor } from "../../../Features/InfrastructureMonitors/infrastructureMonitorsSlice";
import { capitalizeFirstLetter } from "../../../Utils/stringUtils";

// MUI
import { Box, Stack, Typography, Button, ButtonGroup } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";

//Components
import Breadcrumbs from "../../../Components/Breadcrumbs";
import Link from "../../../Components/Link";
import { ConfigBox } from "../../Uptime/styled";
import TextInput from "../../../Components/Inputs/TextInput";
import { HttpAdornment } from "../../../Components/Inputs/TextInput/Adornments";
import { createToast } from "../../../Utils/toastUtils";
import Checkbox from "../../../Components/Inputs/Checkbox";
import Select from "../../../Components/Inputs/Select";
import { CustomThreshold } from "./CustomThreshold";

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
	const { user, authToken } = useSelector((state) => state.auth);
	const monitorState = useSelector((state) => state.infrastructureMonitor);
	const dispatch = useDispatch();
	const navigate = useNavigate();

	// State
	const [errors, setErrors] = useState({});
	const [https, setHttps] = useState(false);
	const [infrastructureMonitor, setInfrastructureMonitor] = useState({
		url: "",
		name: "",
		notifications: [],
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

	// Handlers
	const handleCreateInfrastructureMonitor = async (event) => {
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

		const action = await dispatch(
			createInfrastructureMonitor({ authToken, monitor: form })
		);
		if (action.meta.requestStatus === "fulfilled") {
			createToast({ body: "Infrastructure monitor created successfully!" });
			navigate("/infrastructure");
		} else {
			createToast({ body: "Failed to create monitor." });
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
		const { value } = event.target;
		let notifications = [...infrastructureMonitor.notifications];
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

		setInfrastructureMonitor((prev) => ({
			...prev,
			notifications,
		}));
	};

	return (
		<Box className="create-infrastructure-monitor">
			<Breadcrumbs
				list={[
					{ name: "Infrastructure monitors", path: "/infrastructure" },
					{ name: "create", path: `/infrastructure/create` },
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
						Create your{" "}
					</Typography>
					<Typography
						component="span"
						variant="h2"
						fontSize="inherit"
						fontWeight="inherit"
					>
						monitor
					</Typography>
				</Typography>
				<ConfigBox>
					<Stack gap={theme.spacing(6)}>
						<Typography component="h2">General settings</Typography>
						<Typography component="p">
							Here you can select the URL of the host, together with the friendly name and
							authorization secret to connect to the server agent.
						</Typography>
						<Typography component="p">
							The server you are monitoring must be running the{" "}
							<Link
								level="primary"
								url="https://github.com/bluewave-labs/checkmate-agent"
								label="Checkmate Monitoring Agent"
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
							label="Server URL"
							https={https}
							value={infrastructureMonitor.url}
							onChange={handleChange}
							error={errors["url"] ? true : false}
							helperText={errors["url"]}
						/>
						<Box>
							<Typography component="p">Protocol</Typography>
							<ButtonGroup>
								<Button
									variant="group"
									filled={https.toString()}
									onClick={() => setHttps(true)}
								>
									HTTPS
								</Button>
								<Button
									variant="group"
									filled={(!https).toString()}
									onClick={() => setHttps(false)}
								>
									HTTP
								</Button>
							</ButtonGroup>
						</Box>
						<TextInput
							type="text"
							id="name"
							name="name"
							label="Display name"
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
							label="Authorization secret"
							value={infrastructureMonitor.secret}
							onChange={handleChange}
							error={errors["secret"] ? true : false}
							helperText={errors["secret"]}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography component="h2">Incident notifications</Typography>
						<Typography component="p">
							When there is an incident, notify users.
						</Typography>
					</Box>
					<Stack gap={theme.spacing(6)}>
						<Checkbox
							id="notify-email-default"
							label={`Notify via email (to ${user.email})`}
							isChecked={infrastructureMonitor.notifications.some(
								(notification) => notification.type === "email"
							)}
							value={user?.email}
							onChange={(event) => handleNotifications(event, "email")}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography component="h2">Customize alerts</Typography>
						<Typography component="p">
							Send a notification to user(s) when thresholds exceed a specified
							percentage.
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
									fieldValue={infrastructureMonitor[METRIC_PREFIX + metric]}
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
						<Typography component="h2">Advanced settings</Typography>
					</Box>
					<Stack gap={theme.spacing(12)}>
						<Select
							id="interval"
							name="interval"
							label="Check frequency"
							value={infrastructureMonitor.interval || 15}
							onChange={handleChange}
							onBlur={}
							items={SELECT_VALUES}
						/>
					</Stack>
				</ConfigBox>
				<Stack
					direction="row"
					justifyContent="flex-end"
				>
					<LoadingButton
						variant="contained"
						color="primary"
						onClick={handleCreateInfrastructureMonitor}
						loading={monitorState?.isLoading}
					>
						Create infrastructure monitor
					</LoadingButton>
				</Stack>
			</Stack>
		</Box>
	);
};

export default CreateInfrastructureMonitor;
