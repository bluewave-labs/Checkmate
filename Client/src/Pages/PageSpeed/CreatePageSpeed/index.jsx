// React, Redux, Router
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

// Utility and Network
import { monitorValidation } from "../../../Validation/validation";
import {
	createPageSpeed,
	checkEndpointResolution,
} from "../../../Features/PageSpeedMonitor/pageSpeedMonitorSlice";
import { parseDomainName } from "../../../Utils/monitorUtils";

// MUI
import { useTheme } from "@emotion/react";
import { Box, Stack, Typography, Button, ButtonGroup } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";

//Components
import Breadcrumbs from "../../../Components/Breadcrumbs";
import TextInput from "../../../Components/Inputs/TextInput";
import { HttpAdornment } from "../../../Components/Inputs/TextInput/Adornments";
import { ConfigBox } from "../../Uptime/styled";

import { createToast } from "../../../Utils/toastUtils";
import Radio from "../../../Components/Inputs/Radio";
import Checkbox from "../../../Components/Inputs/Checkbox";
import Select from "../../../Components/Inputs/Select";

const MS_PER_MINUTE = 60000;

const CRUMBS = [
	{ name: "pagespeed", path: "/pagespeed" },
	{ name: "create", path: `/pagespeed/create` },
];

const SELECT_VALUES = [
	{ _id: 3, name: "3 minutes" },
	{ _id: 5, name: "5 minutes" },
	{ _id: 10, name: "10 minutes" },
	{ _id: 20, name: "20 minutes" },
	{ _id: 60, name: "1 hour" },
	{ _id: 1440, name: "1 day" },
	{ _id: 10080, name: "1 week" },
];

const CreatePageSpeed = () => {
	// State
	const [monitor, setMonitor] = useState({
		url: "",
		name: "",
		type: "pagespeed",
		notifications: [],
		interval: 3,
	});

	const [https, setHttps] = useState(true);
	const [errors, setErrors] = useState({});
	const { user, authToken } = useSelector((state) => state.auth);
	const { isLoading } = useSelector((state) => state.pageSpeedMonitors);

	// Setup
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const theme = useTheme();

	// Handlers
	const handleCreateMonitor = async (event) => {
		event.preventDefault();
		let form = {
			url: `http${https ? "s" : ""}://` + monitor.url,
			name: monitor.name === "" ? monitor.url : monitor.name,
			type: monitor.type,
			interval: monitor.interval * MS_PER_MINUTE,
		};

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

		const checkEndpointAction = await dispatch(
			checkEndpointResolution({ authToken, monitorURL: form.url })
		);

		if (checkEndpointAction.meta.requestStatus === "rejected") {
			createToast({
				body: "The endpoint you entered doesn't resolve. Check the URL again.",
			});
			setErrors({ url: "The entered URL is not reachable." });
			return;
		}

		form = {
			...form,
			description: form.name,
			teamId: user.teamId,
			userId: user._id,
			notifications: monitor.notifications,
		};

		const action = await dispatch(createPageSpeed({ authToken, monitor: form }));
		if (action.meta.requestStatus === "fulfilled") {
			createToast({ body: "Monitor created successfully!" });
			navigate("/pagespeed");
		} else {
			createToast({ body: "Failed to create monitor." });
		}
	};

	const handleChange = (event) => {
		const { value, name } = event.target;
		setMonitor({
			...monitor,
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

	const handleBlur = (event) => {
		const { name } = event.target;
		if (name === "url") {
			const { value } = event.target;
			if (monitor.name !== "") {
				return;
			}
			setMonitor((prev) => ({
				...prev,
				name: parseDomainName(value),
			}));
		}
	};

	return (
		<Box
			className="create-monitor"
			sx={{
				"& h1": {
					color: theme.palette.text.primary,
				},
			}}
		>
			<Breadcrumbs list={CRUMBS} />
			<Stack
				component="form"
				className="create-monitor-form"
				onSubmit={handleCreateMonitor}
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
						fontSize="inherit"
						fontWeight="inherit"
						color={theme.palette.text.secondary}
					>
						PageSpeed monitor
					</Typography>
				</Typography>
				<ConfigBox>
					<Box>
						<Typography component="h2">General settings</Typography>
						<Typography component="p">
							Here you can select the URL of the host, together with the type of monitor.
						</Typography>
					</Box>
					<Stack gap={theme.spacing(15)}>
						<TextInput
							type={"url"}
							name="url"
							id="monitor-url"
							label="URL to monitor"
							startAdornment={<HttpAdornment https={https} />}
							placeholder="google.com"
							value={monitor.url}
							onChange={handleChange}
							onBlur={handleBlur}
							error={errors["url"] ? true : false}
							helperText={errors["url"]}
						/>
						<TextInput
							type="text"
							id="monitor-name"
							name="name"
							label="Display name"
							isOptional={true}
							placeholder="Google"
							value={monitor.name}
							onChange={handleChange}
							error={errors["name"] ? true : false}
							helperText={errors["name"]}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography component="h2">Checks to perform</Typography>
						<Typography component="p">
							You can always add or remove checks after adding your site.
						</Typography>
					</Box>
					<Stack gap={theme.spacing(12)}>
						<Stack gap={theme.spacing(6)}>
							<Radio
								id="monitor-checks-http"
								title="PageSpeed"
								desc="Use the Lighthouse PageSpeed API to monitor your website"
								size="small"
								value="http"
								checked={monitor.type === "pagespeed"}
							/>
							<ButtonGroup sx={{ ml: "32px" }}>
								<Button
									variant="group"
									filled={https.toString()}
									onClick={() => setHttps(true)}
								>
									HTTPS
								</Button>
								<Button
									variant="group" // Why does this work?
									filled={(!https).toString()} // There's nothing in the docs about this either
									onClick={() => setHttps(false)}
								>
									HTTP
								</Button>
							</ButtonGroup>
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
						<Typography component="h2">Incident notifications</Typography>
						<Typography component="p">
							When there is an incident, notify users.
						</Typography>
					</Box>
					<Stack gap={theme.spacing(6)}>
						<Typography component="p">When there is a new incident,</Typography>
						<Checkbox
							id="notify-email-default"
							label={`Notify via email (to ${user.email})`}
							isChecked={monitor.notifications.some(
								(notification) => notification.type === "email"
							)}
							value={user?.email}
							onChange={(event) => handleNotifications(event, "email")}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography component="h2">Advanced settings</Typography>
					</Box>
					<Stack gap={theme.spacing(12)}>
						<Select
							id="monitor-interval"
							name="interval"
							label="Check frequency"
							value={monitor.interval || 3}
							onChange={handleChange}
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
						onClick={handleCreateMonitor}
						disabled={!Object.values(errors).every((value) => value === undefined)}
						loading={isLoading}
					>
						Create monitor
					</LoadingButton>
				</Stack>
			</Stack>
		</Box>
	);
};
export default CreatePageSpeed;
