// Components
import { Box, Stack, Typography, Button, ButtonGroup } from "@mui/material";

import Breadcrumbs from "../../../Components/Breadcrumbs";
import ConfigBox from "../../../Components/ConfigBox";
import TextInput from "../../../Components/Inputs/TextInput";
import { HttpAdornment } from "../../../Components/Inputs/TextInput/Adornments";
import Radio from "../../../Components/Inputs/Radio";
import Checkbox from "../../../Components/Inputs/Checkbox";
import Select from "../../../Components/Inputs/Select";
import { createToast } from "../../../Utils/toastUtils";

// Utility
import { useTheme } from "@emotion/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { monitorValidation } from "../../../Validation/validation";
import { useParams } from "react-router-dom";
import { useCreateDistributedUptimeMonitor } from "./Hooks/useCreateDistributedUptimeMonitor";
import { useMonitorFetch } from "./Hooks/useMonitorFetch";
import { useTranslation } from "react-i18next";

// Constants
const MS_PER_MINUTE = 60000;
const SELECT_VALUES = [
	{ _id: 1, name: "1 minute" },
	{ _id: 2, name: "2 minutes" },
	{ _id: 3, name: "3 minutes" },
	{ _id: 4, name: "4 minutes" },
	{ _id: 5, name: "5 minutes" },
];

const parseUrl = (url) => {
	try {
		return new URL(url);
	} catch (error) {
		return null;
	}
};

const CreateDistributedUptime = () => {
	const { monitorId } = useParams();
	const isCreate = typeof monitorId === "undefined";
	const { t } = useTranslation();

	let BREADCRUMBS = [
		{ name: `distributed uptime`, path: "/distributed-uptime" },
		...(isCreate ? [] : [{ name: "details", path: `/distributed-uptime/${monitorId}` }]),
		{ name: isCreate ? "create" : "configure", path: `` },
	];

	// Redux state
	const { user } = useSelector((state) => state.auth);

	// Local state
	const [https, setHttps] = useState(true);
	const [notifications, setNotifications] = useState([]);
	const [form, setForm] = useState({
		type: "distributed_http",
		name: "",
		url: "",
		interval: 1,
	});
	const [errors, setErrors] = useState({});

	//utils
	const theme = useTheme();
	const navigate = useNavigate();
	const [createDistributedUptimeMonitor, isLoading, networkError] =
		useCreateDistributedUptimeMonitor({ isCreate, monitorId });

	const [monitor, monitorIsLoading, monitorNetworkError] = useMonitorFetch({
		monitorId,
		isCreate,
	});

	// Effect to set monitor to fetched monitor
	useEffect(() => {
		if (typeof monitor !== "undefined") {
			const parsedUrl = parseUrl(monitor?.url);
			const protocol = parsedUrl?.protocol?.replace(":", "") || "";
			setHttps(protocol === "https");

			const newForm = {
				name: monitor.name,
				interval: monitor.interval / MS_PER_MINUTE,
				url: parsedUrl.host,
				type: monitor.type,
			};

			setForm(newForm);
		}
	}, [monitor]);

	// Handlers
	const handleCreateMonitor = async () => {
		const monitorToSubmit = { ...form };

		// Prepend protocol to url
		monitorToSubmit.url = `http${https ? "s" : ""}://` + monitorToSubmit.url;

		const { error } = monitorValidation.validate(monitorToSubmit, {
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

		// Append needed fields
		monitorToSubmit.description = form.name;
		monitorToSubmit.interval = form.interval * MS_PER_MINUTE;
		monitorToSubmit.teamId = user.teamId;
		monitorToSubmit.userId = user._id;
		monitorToSubmit.notifications = notifications;

		const success = await createDistributedUptimeMonitor({ form: monitorToSubmit });
		if (success) {
			createToast({ body: "Monitor created successfully!" });
			navigate("/distributed-uptime");
		} else {
			createToast({ body: "Failed to create monitor." });
		}
	};

	const handleChange = (event) => {
		let { name, value } = event.target;

		setForm({
			...form,
			[name]: value,
		});
		const { error } = monitorValidation.validate(
			{ [name]: value },
			{ abortEarly: false }
		);
		setErrors((prev) => ({
			...prev,
			...(error ? { [name]: error.details[0].message } : { [name]: undefined }),
		}));
	};

	const handleNotifications = (event, type) => {
		const { value } = event.target;
		let currentNotifications = [...notifications];
		const notificationAlreadyExists = notifications.some((notification) => {
			if (notification.type === type && notification.address === value) {
				return true;
			}
			return false;
		});
		if (notificationAlreadyExists) {
			currentNotifications = currentNotifications.filter((notification) => {
				if (notification.type === type && notification.address === value) {
					return false;
				}
				return true;
			});
		} else {
			currentNotifications.push({ type, address: value });
		}
		setNotifications(currentNotifications);
	};

	return (
		<Box>
			<Breadcrumbs list={BREADCRUMBS} />
			<Stack
				component="form"
				gap={theme.spacing(12)}
				mt={theme.spacing(6)}
				onSubmit={() => console.log("submit")}
			>
				<Typography
					component="h1"
					variant="h1"
				>
					<Typography
						component="span"
						fontSize="inherit"
					>
						{isCreate ? "Create your" : "Edit your"}{" "}
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
						<Typography component="h2">{t("settingsGeneralSettings")}</Typography>
						<Typography component="p">
							{t("distributedUptimeCreateSelectURL")}
						</Typography>
					</Box>
					<Stack gap={theme.spacing(15)}>
						<TextInput
							type={"url"}
							id="monitor-url"
							startAdornment={<HttpAdornment https={https} />}
							label="URL to monitor"
							https={https}
							placeholder={"www.google.com"}
							disabled={!isCreate}
							value={form.url}
							name="url"
							onChange={handleChange}
							error={errors["url"] ? true : false}
							helperText={errors["url"]}
						/>
						<TextInput
							type="text"
							id="monitor-name"
							label="Display name"
							isOptional={true}
							placeholder={"Google"}
							value={form.name}
							name="name"
							onChange={handleChange}
							error={errors["name"] ? true : false}
							helperText={errors["name"]}
						/>
					</Stack>
				</ConfigBox>
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
								title="Website monitoring"
								desc="Use HTTP(s) to monitor your website or API endpoint."
								size="small"
								value="http"
								name="type"
								checked={true}
								onChange={handleChange}
							/>
							{form.type === "http" || form.type === "distributed_http" ? (
								<ButtonGroup
									disabled={!isCreate}
									sx={{ ml: theme.spacing(16) }}
								>
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
						<Typography component="h2">{t("distributedUptimeCreateIncidentNotification")}</Typography>
						<Typography component="p">
							{t("distributedUptimeCreateIncidentDescription")}
						</Typography>
					</Box>
					<Stack gap={theme.spacing(6)}>
						<Checkbox
							id="notify-email-default"
							label={`Notify via email (to ${user.email})`}
							isChecked={notifications.some(
								(notification) => notification.type === "email"
							)}
							value={user?.email}
							onChange={(event) => handleNotifications(event, "email")}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography component="h2">{t("distributedUptimeCreateAdvancedSettings")}</Typography>
					</Box>
					<Stack gap={theme.spacing(12)}>
						<Select
							id="monitor-interval"
							label="Check frequency"
							name="interval"
							value={form.interval}
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
						onClick={() => handleCreateMonitor()}
						disabled={!Object.values(errors).every((value) => value === undefined)}
						loading={isLoading}
					>
						{isCreate ? "Create monitor" : "Configure monitor"}
					</Button>
				</Stack>
			</Stack>
		</Box>
	);
};

export default CreateDistributedUptime;
